# How to use the samples

There are a few accounts you'll need set up and pieces of software that need to get installed to get started.

## Prerequisites

1. [Github account](https://github.com/)
2. [Azure account](https://azure.microsoft.com/en-au/free/search/?&ef_id=Cj0KCQiAr8bwBRD4ARIsAHa4YyLdFKh7JC0jhbxhwPeNa8tmnhXciOHcYsgPfNB7DEFFGpNLTjdTPbwaAh8bEALw_wcB:G:s&OCID=AID2000051_SEM_O2ShDlJP&MarinID=O2ShDlJP_332092752199_azure%20account_e_c__63148277493_aud-390212648371:kwd-295861291340&lnkd=Google_Azure_Brand&dclid=CKjVuKOP7uYCFVapaAoddSkKcA)
   - *Permissions needed*: ability to create and deploy to an azure [resource group](https://docs.microsoft.com/en-us/azure/azure-resource-manager/management/overview), a [service principal](https://docs.microsoft.com/en-us/azure/active-directory/develop/app-objects-and-service-principals), and grant the [collaborator role](https://docs.microsoft.com/en-us/azure/role-based-access-control/overview) to the service principal over the resource group.
3. [Azure DevOps account](https://azure.microsoft.com/en-us/services/devops/)
   - *Permissions needed*: ability to create [service connections](https://docs.microsoft.com/en-us/azure/devops/pipelines/library/service-endpoints?view=azure-devops&tabs=yaml) and [pipelines](https://docs.microsoft.com/en-us/azure/devops/pipelines/get-started/pipelines-get-started?view=azure-devops&tabs=yaml).

### Software Prerequisites

1. For Windows users, [Windows Subsystem for Linux](https://docs.microsoft.com/en-us/windows/wsl/install-win10)
2. [Azure CLI 2.0.49+](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest)
3. [Azure DevOps CLI](https://marketplace.visualstudio.com/items?itemName=ms-vsts.cli)

### Setup

To setup the samples, run the following:

1. Ensure that:
   - You are logged in to the Azure CLI. To login, run `az login`.
   - Azure CLI is targeting the Azure Subscription you want to deploy the resources to.
      - To set target Azure Subscription, run `az account set -s <AZURE_SUBSCRIPTION_ID>`
   - Azure CLI is targeting the Azure DevOps organization and project you want to deploy the pipelines to. 
      - To set target Azure DevOps project, run `az devops configure --defaults organization=https://dev.azure.com/MY_ORG/ project=MY_PROJECT`
2. Fork and clone this repository.
*Your forked repo will serve as the main repository which triggers all pipelines -- allowing you complete control over the sample solution as compared to using the main Azure-Samples repository directly.*
*All pipeline defintions are also pulled from this fork*.