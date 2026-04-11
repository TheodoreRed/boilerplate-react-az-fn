terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }
}

provider "azurerm" {
  features {}
  subscription_id                 = var.subscription_id
  resource_provider_registrations = "none"
}

resource "azurerm_resource_group" "main" {
  name     = "rg-${var.app_name}"
  location = var.location
}

resource "azurerm_static_web_app" "staging" {
  name                = "swa-${var.app_name}-stg"
  resource_group_name = azurerm_resource_group.main.name
  location            = var.location
  sku_tier            = "Free"
  sku_size            = "Free"
}

resource "azurerm_static_web_app" "prod" {
  name                = "swa-${var.app_name}-prod"
  resource_group_name = azurerm_resource_group.main.name
  location            = var.location
  sku_tier            = "Free"
  sku_size            = "Free"
}

resource "azurerm_storage_account" "functions" {
  name                     = replace("st${var.app_name}fn", "-", "")
  resource_group_name      = azurerm_resource_group.main.name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "azurerm_storage_container" "deployments" {
  name                  = "deploymentpackage"
  storage_account_id    = azurerm_storage_account.functions.id
  container_access_type = "private"
}

resource "azurerm_service_plan" "flex" {
  name                = "plan-${var.app_name}-flex"
  resource_group_name = azurerm_resource_group.main.name
  location            = var.location
  os_type             = "Linux"
  sku_name            = "FC1"
}

resource "azurerm_function_app_flex_consumption" "staging" {
  name                        = "fn-${var.app_name}-stg"
  resource_group_name         = azurerm_resource_group.main.name
  location                    = var.location
  service_plan_id             = azurerm_service_plan.flex.id
  storage_container_type      = "blobContainer"
  storage_container_endpoint  = "${azurerm_storage_account.functions.primary_blob_endpoint}${azurerm_storage_container.deployments.name}"
  storage_authentication_type = "StorageAccountConnectionString"
  storage_access_key          = azurerm_storage_account.functions.primary_access_key
  runtime_name                = "node"
  runtime_version             = "22"
  maximum_instance_count      = 100
  instance_memory_in_mb       = 2048

  site_config {}

  app_settings = {
    "FUNCTIONS_EXTENSION_VERSION" = "~4"
  }
}

resource "azurerm_function_app_flex_consumption" "prod" {
  name                        = "fn-${var.app_name}-prod"
  resource_group_name         = azurerm_resource_group.main.name
  location                    = var.location
  service_plan_id             = azurerm_service_plan.flex.id
  storage_container_type      = "blobContainer"
  storage_container_endpoint  = "${azurerm_storage_account.functions.primary_blob_endpoint}${azurerm_storage_container.deployments.name}"
  storage_authentication_type = "StorageAccountConnectionString"
  storage_access_key          = azurerm_storage_account.functions.primary_access_key
  runtime_name                = "node"
  runtime_version             = "22"
  maximum_instance_count      = 100
  instance_memory_in_mb       = 2048

  site_config {}

  app_settings = {
    "FUNCTIONS_EXTENSION_VERSION" = "~4"
  }
}