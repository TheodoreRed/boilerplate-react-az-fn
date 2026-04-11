# Deploy New App

## 1. Set your app name

Open terraform.tfvars and change app_name:

    app_name = "your-new-app-name"

Rules: lowercase, numbers, hyphens only. 3-20 characters.

## 2. Create a workspace

    terraform workspace new your-new-app-name

## 3. Create the infrastructure

    terraform apply

Type "yes" when prompted.

## 4. Get your outputs

    terraform output

For sensitive values (SWA deployment tokens):

    terraform output -raw swa_staging_api_key
    terraform output -raw swa_prod_api_key

## Useful commands

| What | Command |
|---|---|
| See all apps | terraform workspace list |
| Switch to an app | terraform workspace select appname |
| See what exists | terraform output |
| Delete an app's infra | terraform workspace select appname then terraform destroy |
