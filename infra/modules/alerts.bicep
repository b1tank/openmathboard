@description('Email address for alert notifications')
param alertEmail string

@description('Application Insights resource ID')
param appInsightsId string

// Action group — sends email when alerts fire
resource actionGroup 'Microsoft.Insights/actionGroups@2023-01-01' = {
  name: 'openmathboard-alerts'
  location: 'global'
  properties: {
    groupShortName: 'omb-alert'
    enabled: true
    emailReceivers: [
      {
        name: 'admin-email'
        emailAddress: alertEmail
        useCommonAlertSchema: true
      }
    ]
  }
}

// Alert 1: App down — 0 successful responses for 5 minutes
resource appDownAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'openmathboard-app-down'
  location: 'global'
  properties: {
    description: 'No successful HTTP responses for 5 minutes — app may be down'
    severity: 0
    enabled: true
    scopes: [
      appInsightsId
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'no-requests'
          metricName: 'requests/count'
          metricNamespace: 'microsoft.insights/components'
          operator: 'LessThanOrEqual'
          threshold: 0
          timeAggregation: 'Count'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

// Alert 2: High error rate — >5 server errors over 5 minutes
resource highErrorRateAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'openmathboard-high-error-rate'
  location: 'global'
  properties: {
    description: 'Server error rate exceeds 5% over 5 minutes'
    severity: 1
    enabled: true
    scopes: [
      appInsightsId
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'high-5xx-rate'
          metricName: 'requests/failed'
          metricNamespace: 'microsoft.insights/components'
          operator: 'GreaterThan'
          threshold: 5
          timeAggregation: 'Count'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

// Alert 3: Slow responses — p95 server response time > 5s
resource slowResponseAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'openmathboard-slow-response'
  location: 'global'
  properties: {
    description: 'Server response time p95 exceeds 5 seconds'
    severity: 2
    enabled: true
    scopes: [
      appInsightsId
    ]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'slow-p95'
          metricName: 'requests/duration'
          metricNamespace: 'microsoft.insights/components'
          operator: 'GreaterThan'
          threshold: 5000
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

@description('Action group resource ID')
output actionGroupId string = actionGroup.id
