# This script will determine a the URL for a databricks workspace
# That is inside of Azure in a given Resource Group and nmae
# It will set the environment variables:
#   DATABRICKS_HOST_URL
#   DATABRICKS_TOKEN
# Which can be used to make API calls against the HOST URL with the TOKEN
# The token is only valid for 600 seconds

tenantId=$(az account show --query tenantId -o tsv)
wsId=$(az resource show \
  --resource-type Microsoft.Databricks/workspaces \
  -g "$RESOURCE_GROUP" \
  -n "$DATABRICKS_WORKSPACE" \
  --query id -o tsv)

DATABRICKS_HOST_URL='https://'$(az resource show \
  --resource-type Microsoft.Databricks/workspaces \
  -g "$RESOURCE_GROUP" \
  -n "$DATABRICKS_WORKSPACE" \
  --query properties.workspaceUrl -o tsv)

# Set ENV variable DATABRICKS_HOST_URL for later steps
echo '##vso[task.setvariable variable=DATABRICKS_HOST_URL]'$DATABRICKS_HOST_URL

# Get a token for the global Databricks application.
# The resource name is fixed and never changes.
token_response=$(az account get-access-token --resource 2ff814a6-3304-4ab8-85cb-cd0e6f879c1d)
token=$(jq .accessToken -r <<< "$token_response")

# Get a token for the Azure management API
token_response=$(az account get-access-token --resource https://management.core.windows.net/)
azToken=$(jq .accessToken -r <<< "$token_response")

# You can also generate a PAT token. Note the quota limit of 600 tokens.
api_response=$(curl -sf $DATABRICKS_HOST_URL/api/2.0/token/create \
  -H "Authorization: Bearer $token" \
  -H "X-Databricks-Azure-SP-Management-Token:$azToken" \
  -H "X-Databricks-Azure-Workspace-Resource-Id:$wsId" \
  -d '{ "lifetime_seconds": 600, "comment": "Pipeline Temp Token" }')

# Set ENV Variables DATABRICKS_TOKEN for later steps
echo '##vso[task.setvariable variable=DATABRICKS_TOKEN]' $(jq .token_value -r <<< "$api_response")
