const fs = require('fs');
const axios = require('axios');
const argv = require('minimist')(process.argv.slice(2));

if (!argv.n) {
    console.error("-n parameter required with Job path");
    process.exit(1);
}

if (!argv.d) {
    console.error("-d parameter required with Databricks Workspace URL");
    process.exit(1);
}

const jobPath = argv.n;
const dbwURL = argv.d;
const dbwToken = process.env['DATABRICKS_TOKEN'];

if (dbwToken === undefined) {
    console.error("DATABRICKS_TOKEN environment variable must be set");
    process.exit(1);
}

if (!fs.existsSync(jobPath)) {
    console.error("Invalid Job File Path");
    process.exit(1);
}

// Search for jobs
async function deployJobs() {

    const instance = axios.create({
        baseURL: dbwURL,
        headers: {
            'Authorization': 'Bearer' + dbwToken
        }
    });

    const jobDefinition = JSON.parse(fs.readFileSync(jobPath));
    const jobName = jobDefinition.name;

    if (jobName === undefined || jobName.length === 0) {
        console.error("Job definition does not have a name!");
        process.exit(2);
    }

    let jobs = []
    try {
        console.log(`Querying workspace for jobs with name ${jobName}...`);
        const res = await instance.get('/api/2.0/jobs/list');
        jobs = res.data.jobs;
    } catch (e) {
        console.error("Failed to get list of jobs");
        throw e;
    }

    // No jobs found
    if (jobs === undefined) {
        jobs = [];
    }

    const matchingJobs = jobs.filter(job => job.settings.name === jobName);
    if (matchingJobs.length > 1) {
        console.error("More than one job has the job name " + jobName);
        process.exit(2);
    }
    const jobExists = matchingJobs.length === 1;
    let jobId = undefined;

    if (jobExists) {
        console.log("Job exists...");
        jobId = matchingJobs[0].job_id;

        console.log(`Getting existing runs for job ${jobId}...`);

        let runs = [];
        try {
            const res = await instance.get('/api/2.0/jobs/runs/list', {
                params: {
                    job_id: jobId,
                    active_only: true
                }
            });
            runs = res.data.runs || [];
        } catch (e) {
            console.error("Failed to get runs for job.");
            throw e;
        }

        console.log(`Found ${runs.length} active runs.`);
        if (runs.length > 0) {

            // Cancel all of the runs
            for (let i = 0; i < runs.length; ++i) {
                const runId = runs[i].run_id;

                try {
                    console.log(`Cancelling run ${runId}`)
                    const res = await instance.post('/api/2.0/jobs/runs/cancel', {
                        run_id: runs[i].run_id
                    });
                } catch (e) {
                    console.error("Failed to cancel run");
                    throw e;
                }
            }

            // Wait awhile for the runs to actually finish
            const numRetryAttempts = 5;
            for (let i = 0; i < runs.length; ++i) {
                const runId = runs[i].run_id;
                for (let j = 0; j < numRetryAttempts; ++j) {

                    try {
                        console.log(`Waiting for run ${runId} to cancel...`)
                        const res = await instance.get('/api/2.0/jobs/runs/get', {
                            params: {
                                run_id: runId
                            }
                        });
                        const isRunning = res.data.state.life_cycle_state === "RUNNING";
                        if (!isRunning) {
                            // If you try and submit a new run too quickly after the old one finishes, then it will be skipped if max run count == 1
                            console.log(`Run ${runId} has stopped... waiting 15 seconds for resources to be released...`);
                            await new Promise(r => setTimeout(r, 15000));
                            break;
                        }
                    } catch (e) {
                        console.error("Failed to get status of run");
                        throw e;
                    }

                    if (j + 1 != numRetryAttempts) {
                        await new Promise(r => setTimeout(r, (j + 1) * 5000));
                    } else {
                        console.log(`Run ${runId} still hasn't stopped, continuing anyways`);
                    }
                }
            }
        }

        // Update job definition
        try {
            console.log('Updating job definition...');
            const res = await instance.post('/api/2.0/jobs/reset', {
                job_id: jobId,
                new_settings: jobDefinition
            });
        } catch (e) {
            console.error("Failed to reset job.");
            throw e;
        }
        
        
    } else {
        // Create new job
        console.log("Job doesn't exist, creating a new job...");
        try {
            const res = await instance.post('/api/2.0/jobs/create', jobDefinition);
            jobId = res.data.job_id;
            console.log(`Job ${jobId} created.`);
        } catch (e) {
            console.error("Failed to create job.");
            throw e;
        }
    }

    // Create new runs
    try {
        const res = await instance.post('/api/2.0/jobs/run-now', {
            job_id: jobId
        });
        console.log("Created new run with id of " + res.data.run_id);
    } catch (e) {
        console.error("Failed to create run.");
        throw e;
    }
}

async function tryDeployJobs() {
    try {
        await deployJobs();
    } catch (e) {
        console.error("Encountered an unrecoverable error: ");
        console.error(e);
        if (e.response) {
            console.error(e.response);
        }
        process.exit(3);
        
    }
}

tryDeployJobs();

