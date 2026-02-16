@description('Azure region for all resources')
param location string = resourceGroup().location

// Log Analytics workspace — shared by Container Apps Environment and App Insights
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: 'openmathboard-logs'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// Application Insights connected to the Log Analytics workspace
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: 'openmathboard-insights'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    RetentionInDays: 30
    IngestionMode: 'LogAnalytics'
  }
}

@description('Application Insights connection string for OTel exporter')
output connectionString string = appInsights.properties.ConnectionString

@description('Application Insights instrumentation key')
output instrumentationKey string = appInsights.properties.InstrumentationKey

@description('Application Insights resource ID')
output id string = appInsights.id

@description('Log Analytics workspace customer ID')
output logAnalyticsCustomerId string = logAnalytics.properties.customerId

@description('Log Analytics workspace shared key')
output logAnalyticsSharedKey string = logAnalytics.listKeys().primarySharedKey

@description('Log Analytics workspace resource ID')
output logAnalyticsWorkspaceId string = logAnalytics.id
