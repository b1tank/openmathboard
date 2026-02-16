targetScope = 'resourceGroup'

// ─── Parameters ─────────────────────────────────────────────────────────────

@description('Custom domain name for the site')
param domainName string

@description('Email address for alert notifications')
param alertEmail string

@description('Azure region — defaults to resource group location')
param location string = resourceGroup().location

// ─── Modules ────────────────────────────────────────────────────────────────

module appInsights 'modules/appinsights.bicep' = {
  name: 'appinsights'
  params: {
    location: location
  }
}

module containerApp 'modules/containerapp.bicep' = {
  name: 'containerapp'
  params: {
    location: location
    logAnalyticsCustomerId: appInsights.outputs.logAnalyticsCustomerId
    logAnalyticsSharedKey: appInsights.outputs.logAnalyticsSharedKey
  }
}

module alerts 'modules/alerts.bicep' = {
  name: 'alerts'
  params: {
    alertEmail: alertEmail
    appInsightsId: appInsights.outputs.id
  }
}

module grafana 'modules/grafana.bicep' = {
  name: 'grafana'
  params: {
    location: location
    appInsightsId: appInsights.outputs.id
    logAnalyticsWorkspaceId: appInsights.outputs.logAnalyticsWorkspaceId
  }
}

// ─── DNS ────────────────────────────────────────────────────────────────────
// Uncomment after first deployment to configure custom domain:
//
// module dns 'modules/dns.bicep' = {
//   name: 'dns'
//   params: {
//     domainName: domainName
//     appServiceIp: '<CONTAINER_APP_IP>'
//     appServiceHostname: containerApp.outputs.fqdn
//     verificationId: '<CUSTOM_DOMAIN_VERIFICATION_ID>'
//   }
// }

// ─── Outputs ────────────────────────────────────────────────────────────────

@description('Container App URL')
output appUrl string = containerApp.outputs.url

@description('ACR login server')
output acrLoginServer string = containerApp.outputs.acrLoginServer

@description('Application Insights connection string')
output appInsightsConnectionString string = appInsights.outputs.connectionString

@description('Application Insights instrumentation key')
output appInsightsInstrumentationKey string = appInsights.outputs.instrumentationKey

@description('Grafana dashboard URL')
output grafanaEndpoint string = grafana.outputs.endpoint
