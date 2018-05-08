<?php
$uploads_dir = 'elements/images/icon';
$relative_path = 'images/icon';
///echo '<pre>';print_r($_FILES);die;
if(isset($_FILES['formData'])){
	$output['status']=FALSE;
	$allowed_types = array("image/jpeg","image/pjpeg","image/png","image/vnd.microsoft.icon","image/x-png" );
	if ($_FILES['formData']["error"] > 0) {
		$output['error']= "Error in File";
	}elseif (!in_array($_FILES['formData']['type'], $allowed_types)) {
		$output['error']= "You can only upload JPG, PNG and ICO file";
	}elseif (round($_FILES['formData']['size'] / 1024) > 4096) {
		$output['error']= "You can upload file size up to 4 MB";
	} else {
		$path[0] = $_FILES['formData']['tmp_name'];
		$name = $_FILES['formData']['name'];
		$file_type = $_FILES['formData']['type'];

		if(in_array($file_type, $allowed_types)) {
			if (move_uploaded_file( $path[0], dirname($_SERVER['SCRIPT_FILENAME'])."/".$uploads_dir."/".$name ) ) {
				//echo "yes";
			} else {
				$output['error'] = "The uploaded file couldn't be saved. Please make sure you have provided a correct upload folder and that the upload folder is writable.";
			}
		}
		$output['status']=TRUE;
		$output['favicon_icon'] = $relative_path."/".$name;
	}
	echo json_encode($output);die;
}
?>	