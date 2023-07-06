@description('The name of the function app that you wish to create')
param appName string = 'bg-group-sync'

@description('Storage Account type')
@allowed([
  'Standard_LRS'
  'Standard_GRS'
  'Standard_RAGRS'
])
param storageAccountType string = 'Standard_LRS'

@description('Location for all resources')
param location string = resourceGroup().location

@description('Location for Application Insights')
param appInsightsLocation string = location

@description('Storage account name')
param storageAccountName string = 'bggroupsync'

var defaultSettings = loadJsonContent('default.settings.json').Values

var defaultSettingsArray = [for value in items(defaultSettings): {
  name: value.key
  value: value.value
}]

var functionAppSettings = [
  {
    name: 'AzureWebJobsStorage'
    value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccountName};EndpointSuffix=${environment().suffixes.storage};AccountKey=${storageAccount.listKeys().keys[0].value}'
  }
  {
    name: 'WEBSITE_CONTENTAZUREFILECONNECTIONSTRING'
    value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccountName};EndpointSuffix=${environment().suffixes.storage};AccountKey=${storageAccount.listKeys().keys[0].value}'
  }
  {
    name: 'WEBSITE_CONTENTSHARE'
    value: toLower(appName)
  }
  {
    name: 'APPINSIGHTS_INSTRUMENTATIONKEY'
    value: applicationInsights.properties.InstrumentationKey
  }
]

var functionAppSettingsObj = toObject(functionAppSettings, setting => setting.name)

var defaultSettingsFiltered = filter(defaultSettingsArray, setting => !contains(functionAppSettingsObj, setting.name))

resource storageAccount 'Microsoft.Storage/storageAccounts@2022-09-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: storageAccountType
  }
  kind: 'Storage'
  properties: {
    supportsHttpsTrafficOnly: true
    defaultToOAuthAuthentication: true
  }
}

resource hostingPlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: appName
  location: location
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
  }
  kind: 'functionapp'
  properties: {
    reserved: true
  }
}

resource functionApp 'Microsoft.Web/sites@2022-09-01' = {
  name: appName
  location: location
  kind: 'functionapp,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: hostingPlan.id
    siteConfig: {
      appSettings: concat(functionAppSettings, defaultSettingsFiltered)
      linuxFxVersion: 'node|18'
    }
    httpsOnly: true
  }
}

resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appName
  location: appInsightsLocation
  kind: 'web'
  properties: {
    Application_Type: 'web'
    Request_Source: 'rest'
  }
}
