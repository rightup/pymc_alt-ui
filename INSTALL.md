# Installing pyMC UI on Raspberry Pi

Simple guide to download and install the latest pyMC UI on your Raspberry Pi.

## Quick Install

```bash
# Download the latest release
cd /tmp
wget https://github.com/rightup/pymc_alt-ui/releases/latest/download/pymc-ui-latest.tar.gz

# Extract to web directory
sudo mkdir -p /var/www/html/pymc-ui
sudo tar -xzf pymc-ui-latest.tar.gz -C /var/www/html/pymc-ui/

# Set proper permissions
sudo chown -R www-data:www-data /var/www/html/pymc-ui
sudo chmod -R 755 /var/www/html/pymc-ui

# Clean up
rm pymc-ui-latest.tar.gz
```