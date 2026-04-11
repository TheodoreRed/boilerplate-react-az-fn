variable "app_name" {
  description = "Short name for the app (e.g. 'budgetpal'). Used in all resource names."
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9-]{3,20}$", var.app_name))
    error_message = "app_name must be 3-20 chars, lowercase alphanumeric and hyphens only."
  }
}

variable "subscription_id" {
  description = "Azure subscription ID"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "eastus2"
}
