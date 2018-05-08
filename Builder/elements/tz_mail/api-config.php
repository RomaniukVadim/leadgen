<?php
$export_mail_type = 'tz_response';

/* Google Recaptcha Secret Key */
$g_secret_key = '6LdQXBoTAAAAABecuaifdBKXJ_gsnFtGkN_xvrJJ'; 

/* AWeber List Name. 
Get AWeber List Name from https://www.aweber.com/users/autoresponder/manage
*/

define('aweber_list_name','');

/* ActiveCampaign API URL, API KEY and List ID. 
Get API URL, API KEY and list id from go to http://www.activecampaign.com/ > My Settings > Developers
*/

define('ac_api_url','https://themezaa.api-us1.com');
define('ac_api_key','51fdad0740a16768872093008bb7755bd480418ffe570c2f1ed05a816211aa8e0006ee74');
define('ac_api_listid','1');

/* Custom Email Recipient email address & Email subject line */
$tz_email = ''; 
$tz_from_email = '';
$tz_subject = '';


/* Campaign Monitor API key and List ID. 
Get CM API KEY from https://your-username.createsend.com/admin/account/
Get CM List ID from https://www.campaignmonitor.com/api/getting-started/#listid
*/

define('cm_api_key', '97e8c0ddae259b3e504ff1173dbe8d67dfgsd');
define('cm_list_id', '7143e7b0b3bc440b1a605a2f624c13ad');

/* GetResponse API key and Campaign Token. 
Get GetResponse API KEY from https://app.getresponse.com/my_api_key.html
Get GetResponse Campaign Token from https://app.getresponse.com/campaign_list.html
*/

define('getresponse_api_key','7a31b74296a01e09b66f3607d416ab31'); 
define('getresponse_campaign_token','n8WOH'); 

/* Mailchimp API key and List ID. 
Get Mailchimp API key from http://admin.mailchimp.com/account/api
Get Mailchimp List ID from http://admin.mailchimp.com/lists/
*/

define('mailchimp_api_key', 'e27082efbec71a7777783b35e68e7e0c-us8'); 
define('mailchimp_api_listid', 'e84664cb52');

/* MailerLite API KEY & GROUP ID
Get API KEY and GROUP ID from go to https://app.mailerlite.com/integrations/api/
*/

define('ml_api_key','b70e696f6f18f0ac86a0a29f668dea42');
define('ml_groupid','4188569');
?>