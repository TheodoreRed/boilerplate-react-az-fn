output "resource_group_name" {
  value = azurerm_resource_group.main.name
}

output "swa_staging_hostname" {
  value = azurerm_static_web_app.staging.default_host_name
}

output "swa_prod_hostname" {
  value = azurerm_static_web_app.prod.default_host_name
}

output "swa_staging_api_key" {
  value     = azurerm_static_web_app.staging.api_key
  sensitive = true
}

output "swa_prod_api_key" {
  value     = azurerm_static_web_app.prod.api_key
  sensitive = true
}

output "fn_staging_name" {
  value = azurerm_function_app_flex_consumption.staging.name
}

output "fn_prod_name" {
  value = azurerm_function_app_flex_consumption.prod.name
}

output "fn_staging_default_hostname" {
  value = azurerm_function_app_flex_consumption.staging.default_hostname
}

output "fn_prod_default_hostname" {
  value = azurerm_function_app_flex_consumption.prod.default_hostname
}

output "api_app_client_id" {
  value = azuread_application.api.client_id
}

output "api_app_scope" {
  value = "api://${var.app_name}-api/access_as_user"
}

output "cosmos_endpoint" {
  value = azurerm_cosmosdb_account.main.endpoint
}

output "cosmos_key" {
  value     = azurerm_cosmosdb_account.main.primary_key
  sensitive = true
}

output "cosmos_db_name" {
  value = azurerm_cosmosdb_sql_database.main.name
}