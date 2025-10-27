# ---------------------------------------------------------
# PowerShell Script for Managing Environment Variables
# ---------------------------------------------------------

# 1. Set Environment Variable
$env:NODE_ENV="development"

# 2. Get Environment Variable
$env:NODE_ENV

# 3. Remove Environment Variable
Remove-Item Env:NODE_ENV
