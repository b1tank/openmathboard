@description('Azure region for all resources')
param location string = resourceGroup().location

@description('Application Insights resource ID for data source linkage')
param appInsightsId string

@description('Log Analytics workspace resource ID for data source linkage')
param logAnalyticsWorkspaceId string

// Azure Managed Grafana instance
resource grafana 'Microsoft.Dashboard/grafana@2023-09-01' = {
  name: 'openmathboard-grafana'
  location: location
  sku: {
    name: 'Standard'
  }
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    apiKey: 'Disabled'
    deterministicOutboundIP: 'Disabled'
    grafanaIntegrations: {
      azureMonitorWorkspaceIntegrations: []
    }
  }
}

// Grant Grafana's managed identity read access to the monitoring data
// Monitoring Reader role: 43d0d8ad-25c7-4714-9337-8ba259a9fe05
resource grafanaMonitoringReader 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(resourceGroup().id, grafana.id, '43d0d8ad-25c7-4714-9337-8ba259a9fe05')
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '43d0d8ad-25c7-4714-9337-8ba259a9fe05')
    principalId: grafana.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

@description('Grafana dashboard URL')
output endpoint string = grafana.properties.endpoint

@description('Grafana principal ID (for additional role assignments if needed)')
output principalId string = grafana.identity.principalId
