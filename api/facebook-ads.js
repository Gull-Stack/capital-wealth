// Facebook Marketing API integration for Capital Wealth campaign reports
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const FB_APP_ID = process.env.FB_APP_ID;
  const FB_APP_SECRET = process.env.FB_APP_SECRET;
  const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;
  const FB_AD_ACCOUNT_ID = process.env.FB_AD_ACCOUNT_ID;

  if (!FB_ACCESS_TOKEN || !FB_AD_ACCOUNT_ID) {
    return res.status(500).json({ 
      error: 'Missing Facebook API credentials',
      message: 'Please configure FB_ACCESS_TOKEN and FB_AD_ACCOUNT_ID in environment variables'
    });
  }

  try {
    // Get date range from query params or default to last 7 days
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const dateRange = req.query.date_preset || 'last_7d';
    const customStartDate = req.query.start_date || startDate;
    const customEndDate = req.query.end_date || endDate;

    // Facebook Graph API endpoint
    const baseUrl = `https://graph.facebook.com/v19.0/act_${FB_AD_ACCOUNT_ID}`;
    
    // Campaign-level insights
    const campaignFields = [
      'campaign_id',
      'campaign_name', 
      'impressions',
      'clicks',
      'spend',
      'cpm',
      'cpc',
      'ctr',
      'actions'
    ].join(',');

    const campaignUrl = `${baseUrl}/insights?fields=${campaignFields}&level=campaign&date_preset=${dateRange}&access_token=${FB_ACCESS_TOKEN}`;

    // Ad set level data
    const adsetFields = [
      'adset_id',
      'adset_name',
      'campaign_id',
      'campaign_name',
      'impressions',
      'clicks',
      'spend',
      'cpm',
      'cpc',
      'ctr',
      'conversions'
    ].join(',');

    const adsetUrl = `${baseUrl}/insights?fields=${adsetFields}&level=adset&date_preset=${dateRange}&access_token=${FB_ACCESS_TOKEN}`;

    // Fetch campaign and adset data
    const [campaignResponse, adsetResponse] = await Promise.all([
      fetch(campaignUrl),
      fetch(adsetUrl)
    ]);

    if (!campaignResponse.ok || !adsetResponse.ok) {
      throw new Error(`Facebook API error: ${campaignResponse.status} ${adsetResponse.status}`);
    }

    const campaignData = await campaignResponse.json();
    const adsetData = await adsetResponse.json();

    // Calculate summary metrics
    const summary = calculateSummary(campaignData.data);

    return res.status(200).json({
      success: true,
      dateRange: {
        preset: dateRange,
        start_date: customStartDate,
        end_date: customEndDate
      },
      summary,
      campaigns: campaignData.data || [],
      adsets: adsetData.data || [],
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Facebook Ads API Error:', error);
    return res.status(500).json({
      error: 'Failed to fetch Facebook ads data',
      message: error.message
    });
  }
}

function calculateSummary(campaigns) {
  if (!campaigns || campaigns.length === 0) {
    return {
      total_spend: 0,
      total_impressions: 0,
      total_clicks: 0,
      avg_cpc: 0,
      avg_cpm: 0,
      avg_ctr: 0,
      total_conversions: 0
    };
  }

  const totals = campaigns.reduce((acc, campaign) => {
    acc.spend += parseFloat(campaign.spend || 0);
    acc.impressions += parseInt(campaign.impressions || 0);
    acc.clicks += parseInt(campaign.clicks || 0);
    acc.conversions += parseInt(campaign.conversions || 0);
    return acc;
  }, { spend: 0, impressions: 0, clicks: 0, conversions: 0 });

  return {
    total_spend: totals.spend.toFixed(2),
    total_impressions: totals.impressions,
    total_clicks: totals.clicks,
    avg_cpc: totals.clicks > 0 ? (totals.spend / totals.clicks).toFixed(2) : 0,
    avg_cpm: totals.impressions > 0 ? ((totals.spend / totals.impressions) * 1000).toFixed(2) : 0,
    avg_ctr: totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(2) : 0,
    total_conversions: totals.conversions,
    conversion_rate: totals.clicks > 0 ? ((totals.conversions / totals.clicks) * 100).toFixed(2) : 0
  };
}