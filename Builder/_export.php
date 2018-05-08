<?php
ob_start();
/* START: INCLUDE FOLDER SETTING & ASSETS */
$pathToAssets = array("elements/css", "elements/images", "elements/video", "elements/fonts", "elements/js", "elements/tz_mail");
$filename = "tmp/leadgen.zip"; //use the /tmp folder to circumvent any permission issues on the root folder
if (file_exists($filename)) {
    unlink($filename);
}
/* END: INCLUDE FOLDER SETTING & ASSETS */
/* START: API KEYS & VARIABLES */
$export_type = $_POST['export_type'];
$recaptcha = $_POST['g-recaptcha-secret-key'];
$tz_email = $_POST['tz_email'];
$tz_from_email = $_POST['tz_email_from'];
$tz_subject = $_POST['tz_subject'];
$tz_cm_apikey = $_POST['cm_api_key'];
$tz_cm_listid = $_POST['cm_list_id'];
$tz_mc_apikey = $_POST['mailchimp_api_key'];
$tz_mc_listid = $_POST['mailchimp_api_listid'];
$tz_gr_apikey = $_POST['getresponse_api_key'];
$tz_gr_campaign = $_POST['getresponse_campaign_token'];
$tz_active_url = $_POST['ac_api_url'];
$tz_active_api_key = $_POST['ac_api_key'];
$tz_active_list_id = $_POST['ac_api_listid'];
$tz_aw_listname = $_POST['aweber_list_name'];
$tz_mailerlite_api_key = $_POST['ml_api_key'];
$tz_mailerlite_group_id = $_POST['ml_groupid'];
/* END: API KEYS & VARIABLES */
/* CONFIG SETTINGS */
$file_config = 'elements/export/api-config.php';
$get_config = htmlspecialchars(file_get_contents($file_config));
$arr_keys = array('export_type', 'custom_email','custom_from_email','custom_subject', 'g-recaptcha-secret-key', 'mc_config_apikey', 'mc_config_listid', 'cm_config_apikey', 'cm_config_listid', 'gr_config_apikey', 'gr_config_token', 'aw_config_listname', 'ac_config_url', 'ac_config_apikey', 'ac_config_listid', 'ml_config_apikey', 'ml_config_groupid', '&lt;', '&gt;');
$arr_values = array($export_type, $tz_email,$tz_from_email,$tz_subject, $recaptcha, $tz_mc_apikey, $tz_mc_listid, $tz_cm_apikey, $tz_cm_listid, $tz_gr_apikey, $tz_gr_campaign, $tz_aw_listname, $tz_active_url, $tz_active_api_key, $tz_active_list_id, $tz_mailerlite_api_key, $tz_mailerlite_group_id, '<', '>');
$themezaa_config = str_replace($arr_keys, $arr_values, $get_config);
/* END CONFIG SETTINGS */
/* JS SETTINGS */
$file_js = 'elements/export/main.js';
$get_js_config = htmlspecialchars(file_get_contents($file_js));
$arr_keys_js = array('&quot;', '&lt;', '&gt;','&amp;');
$arr_value_js = array('"', '<', '>','&');
$themezaa_config_js = str_replace($arr_keys_js, $arr_value_js, $get_js_config);
/* END JS SETTINGS */
$zip = new ZipArchive();
$zip->open($filename, ZipArchive::CREATE);
/* add folder structure */
foreach ($pathToAssets as $thePath) {
    /* Create recursive directory iterator */
    $files = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($thePath), RecursiveIteratorIterator::LEAVES_ONLY
        );
    foreach ($files as $name => $file) {
        if ($file->getFilename() != '.' && $file->getFilename() != '..') {
            /* Get real path for current file */
            $filePath = $file->getRealPath();
            $temp = explode("/", $name);
            array_shift($temp);
            $newName = implode("/", $temp);
            /* Add current file to archive */
            $zip->addFile($filePath, $newName);
        }
    }
}
foreach ($_POST['pages'] as $page => $content) {
    $html_header = htmlspecialchars(file_get_contents('elements/export/header.html'));
    $html_footer = htmlspecialchars(file_get_contents('elements/export/footer.html'));
    /* SEO Meta values */
    $tz_seo_meta = $_POST['tz_seo'][$page];
    $tz_fav_icon = $_POST['tz_favicon_icon'];
    $tz_new_icon = explode('./elements/', $tz_fav_icon);
    if ($tz_seo_meta) {
        $tz_seo = explode('1_@_2_@', $tz_seo_meta);
        $meta_keys = array('LeadGen - Multipurpose Marketing Landing Page Pack with Page Builder', 'lgdescription', 'lgkeywords', 'lgauthor', '&quot;', '&lt;', '&gt;','images/icon/favicon.png');
        $meta_values = array($tz_seo[0], $tz_seo[1], $tz_seo[2], $tz_seo[3], '"', '<', '>',$tz_new_icon[1]);
        $meta_seo_values = str_replace($meta_keys, $meta_values, $html_header);
    }else{
        $meta_keys = array('LeadGen - Multipurpose Marketing Landing Page Pack with Page Builder', 'lgdescription', 'lgkeywords', 'lgauthor', '&quot;', '&lt;', '&gt;','images/icon/favicon.png');
        $meta_values = array('LeadGen - Multipurpose Marketing Landing Page Pack with Page Builder', 'lgdescription', 'lgkeywords', 'lgauthor', '"', '<', '>',$tz_new_icon[1]);
        $meta_seo_values = str_replace($meta_keys, $meta_values, $html_header);
    }

    /* End SEO Meta values */
    $tz_html_array = array('&quot;','%20','contact-submit');
    $tz_html_keys = array("'","","tz_submit");
    $tz_html_content = str_replace($tz_html_array, $tz_html_keys, $content);
    $tz_footer_keys = array('&lt;','&gt;');
    $tz_footer_values = array('<','>');
    $tz_html_footer = str_replace($tz_footer_keys, $tz_footer_values, $html_footer);
    $tz_content = $meta_seo_values . stripslashes($tz_html_content).$tz_html_footer;
    $zip->addFromString($page . ".html", stripslashes($tz_content));
}
foreach ($_POST['pages'] as $page => $img_content) {
    $dom = new DOMDocument();
    libxml_use_internal_errors(true);
    $dom->loadHTML($img_content);
    $dom->preserveWhiteSpace = false;
    $tags_videos = $dom->getElementsByTagName('video');
    foreach($dom->getElementsByTagName('img') as $all_tags_img)
    {
        $images[] = $all_tags_img->getAttribute('src');
    }
    foreach($tags_videos as $all_tags_video)
    {
        $videos[] = $all_tags_video;
    }
    $files = glob('elements/images/*.{jpg,jpeg,png,gif,PNG,JPG,JPEG,GIF}', GLOB_BRACE);
    foreach($files as $file) {
        $img_folder[] = explode('/', $file);
    }
    $bg_reg = '/url\(([\'\"]?.*[\'\"]?)\)/i';
    preg_match_all($bg_reg, $img_content,$matches);
    foreach($matches[1] as $mat_value) {
        $bg_mat_img[] = $mat_value;
    }
}
if(empty($videos))
{
    $folder_video_delete = 'video/';
    for ($i = 0; $i < $zip->numFiles; $i++){
        $video_info = $zip->statIndex($i);
        if (substr($video_info["name"], 0, strlen($folder_video_delete)) == $folder_video_delete){
            $zip->deleteIndex($i);
        }
    }
}
if(!empty($bg_mat_img))
{
    foreach($bg_mat_img as $value) {
        $char_val = array("&quot;","'");
        $bg_value = str_replace($char_val,"",$value);
        $bg_img = explode('/', $bg_value);
        $bg_ex_img[] = $bg_img[2];
         
        $bg_files = glob('elements/images/bg-image/*.{jpg,jpeg,png,gif,PNG,JPG,JPEG,GIF}', GLOB_BRACE);
        foreach ($bg_files as $bg_file) {
            $bg_folder = explode('/', $bg_file);
            $bg_folder_img[] = $bg_folder[3];
        }
    }
    if(!empty($bg_ex_img))
    {
        $bg_results = array_diff($bg_folder_img,$bg_ex_img);
        foreach ($bg_results as $bg_res) 
        {
            $bg_img_path = 'images/bg-image/' . $bg_res;
            $zip->deleteName($bg_img_path);
        }
    }else{
        $bg_files = glob('elements/images/bg-image/*.{jpg,jpeg,png,gif,PNG,JPG,JPEG,GIF}', GLOB_BRACE);
        foreach ($bg_files as $bg_file) {
            $bg_folder = explode('/', $bg_file);
            $bg_img_path = 'images/bg-image/' . $bg_folder[3];
            $zip->deleteName($bg_img_path);
        } 
    }
}else{
        $bg_files = glob('elements/images/bg-image/*.{jpg,jpeg,png,gif,PNG,JPG,JPEG,GIF}', GLOB_BRACE);
        foreach ($bg_files as $bg_file) {
            $bg_folder = explode('/', $bg_file);
            $bg_img_path = 'images/bg-image/' . $bg_folder[3];
            $zip->deleteName($bg_img_path);
        } 
}
if(!empty($images))
{
    foreach($images as $img) 
    {
        $img_ex = explode('/', $img);
        if(empty($img_ex[2]))
        {
           $temp_img[] = $img_ex[1];
        }else{
           $temp_img[] = $img_ex[2];
        }
        
        foreach ($img_folder as $zip_folder) {
            $exp_img[] = $zip_folder[2];
        }
    }
    $result = array_diff($exp_img, $temp_img);
    foreach ($result as $res) 
    {
        $img_path = 'images/' . $res;
        $zip->deleteName($img_path);
    }
}else{
    foreach($img_folder as $zip_folder) 
    {
        $img_path = 'images/' . $zip_folder[2];
        $zip->deleteName($img_path);        
    }
}
if(!empty($bg_ex_img) && !empty($temp_img))
{
    $all_img = array_merge($bg_ex_img,$temp_img);
}elseif(!empty($bg_ex_img)){
    $all_img = $bg_ex_img;
}else if(!empty($temp_img)){
    $all_img = $temp_img;
}
if(!empty($all_img))
{
    $upload_files = glob('elements/images/uploads/*.{jpg,jpeg,png,gif,PNG,JPG,JPEG,GIF}', GLOB_BRACE);
    foreach ($upload_files as $upload_file) {
        $upload_folder = explode('/', $upload_file);
        $up_folder_img[] = $upload_folder[3];
    }
    if(!empty($up_folder_img))
    {
        $upload_results = array_diff($up_folder_img, $all_img);
        foreach ($upload_results as $up_res) 
        {
            $upload_folder = explode('/', $up_res);
            $up_img_path = 'images/uploads/' . $up_res;
            $zip->deleteName($up_img_path);
        }
    }
}else{
    $upload_files = glob('elements/images/uploads/*.{jpg,jpeg,png,gif,PNG,JPG,JPEG,GIF}', GLOB_BRACE);
    foreach ($upload_files as $upload_file) {
        $upload_folder = explode('/', $upload_file);
        $up_img_path = 'images/uploads/' . $upload_folder[3];
        $zip->deleteName($up_img_path);
    }
}
$folder_to_delete = 'images/thumbs/';
for ($i = 0; $i < $zip->numFiles; $i++) {
    $image_info = $zip->statIndex($i);
    if (substr($image_info["name"], 0, strlen($folder_to_delete)) == $folder_to_delete) {
        $zip->deleteIndex($i);
    }
}
$fileToModify = 'tz_mail/api-config.php';
$fileToJs = 'js/main.js';
$zip->deleteName($fileToJs);
$zip->deleteName($fileToModify);
$zip->addFromString($fileToJs, $themezaa_config_js);
$zip->addFromString($fileToModify, $themezaa_config);
$zip->close();
$yourfile = $filename;
$file_name = basename($yourfile);
header("Content-Type: application/zip");
header("Content-Transfer-Encoding: Binary");
header("Content-Disposition: attachment; filename=$file_name");
header("Content-Length: " . filesize($yourfile));
ob_end_clean();
readfile($yourfile);
unlink('tmp/leadgen.zip');
exit;
?>