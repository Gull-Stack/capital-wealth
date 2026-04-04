# Facebook Ads API Setup for Capital Wealth

## Required Environment Variables

To pull Facebook campaign reports, you need to set these environment variables:

```bash
# Required for Facebook Marketing API
export FB_APP_ID="your_facebook_app_id"
export FB_APP_SECRET="your_facebook_app_secret" 
export FB_ACCESS_TOKEN="your_long_lived_access_token"
export FB_AD_ACCOUNT_ID="your_ad_account_id"
```

## Getting Your Credentials

### 1. Facebook App ID & Secret
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or use existing app
3. Add "Marketing API" product to your app
4. Copy App ID and App Secret from Basic Settings

### 2. Access Token
1. Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app
3. Add these permissions:
   - `ads_read`
   - `ads_management` (if you need to modify campaigns)
4. Generate token and exchange for long-lived token

### 3. Ad Account ID
1. Go to [Facebook Ads Manager](https://adsmanager.facebook.com/)
2. Your account ID is in the URL: `act_1234567890`
3. Use only the numbers: `1234567890`

## Usage

### Web Dashboard
Visit: `https://capitalwealth.com/facebook-report`

### Command Line Reports
```bash
# Last 7 days (default)
node scripts/fb-report.js

# Last 30 days
node scripts/fb-report.js last_30_days

# Output as CSV
node scripts/fb-report.js last_7_days csv

# Output as formatted table
node scripts/fb-report.js last_30_days table
```

### API Endpoint
```bash
# GET request to API endpoint
curl "https://capitalwealth.com/api/facebook-ads?date_preset=last_7_days"
```

## Date Presets Available
- `today`, `yesterday`
- `last_3_days`, `last_7_days`, `last_14_days`, `last_28_days`, `last_30_days`
- `this_month`, `last_month`
- `this_quarter`, `last_quarter`
- `this_year`, `last_year`

## Metrics Included
- **Spend**: Total amount spent
- **Impressions**: Number of times ads were shown
- **Clicks**: Number of clicks on ads
- **CTR**: Click-through rate (clicks/impressions)
- **CPC**: Cost per click
- **CPM**: Cost per thousand impressions
- **Conversions**: Number of conversions tracked
- **Conversion Rate**: Conversions/clicks ratio

## Security Notes
- Never commit credentials to git
- Use environment variables or secure secret management
- Rotate tokens regularly
- Use minimal required permissions
- Monitor API usage limits