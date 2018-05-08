<?php
if($_POST)
{	
	if(isset($_POST['tz-save'])){
		$save_json = $_POST['tz-save'];
	}
	if(isset($_POST['tz-save-flag'])){
	   $save_file = $_POST['tz-save-flag'];
	}
	
	if($save_file == 'save')
	{
		if(!empty($save_json) && $save_json != '' ) 
		{
			header( 'Content-Description: File Transfer' );
			header( 'Content-Type: application/json' );
			header( 'Content-Disposition: attachment; filename=leadgen.json' );
			header( 'Content-Transfer-Encoding: binary' );
			header( 'Connection: Keep-Alive' );
			header( 'Expires: 0' );
			header( 'Cache-Control: must-revalidate, post-check=0, pre-check=0' );
			header( 'Pragma: public' );
			echo $save_json;die;

		}else{
			
			$return['responseCode'] = 0;
			$return['responseHTML'] = '<h5>Ouch!</h5> <p>Something went wrong and the site could not be saved :(</p>';
		}
	}else{
		
		$tz_imp_file = file_get_contents($_FILES['file']['tmp_name']);
		$name = "builder.json";
		if(file_exists($name))
		{
			unlink($name);
			file_put_contents($name, $tz_imp_file, FILE_APPEND);
			chmod($name,0777);
		}else{
			file_put_contents($name, $tz_imp_file, FILE_APPEND);
			chmod($name,0777);
		}
		print_r('Success');die;
	}
}
?>