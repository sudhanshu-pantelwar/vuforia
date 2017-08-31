import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import 'rxjs/add/operator/map';
import {Md5} from 'ts-md5/dist/md5';
declare var CryptoJS: any;
// var mime = require('mime-types');
import * as mime from 'mime-types';
/*
  Generated class for the VfproProvider provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular DI.
*/
@Injectable()
export class VfproProvider {

  constructor(public http: Http) {
    console.log('Hello VfproProvider Provider');
  }

  compute_md5_hex(data){
    let h: any;
    h = Md5.hashStr(data);
    return h;
  }

  compute_hmac_base64(key, data){
    let h = CryptoJS.HmacSHA1("Message", "Key")
    h = CryptoJS.enc.Base64.stringify(h);
    return h;
  }

  authorization_header_for_request(access_key, secret_key, method, content, content_type, date, request_path){
    //"""Return the value of the Authorization header for the request parameters"""
    let components_to_sign = [];
    components_to_sign.push(method)
    components_to_sign.push((this.compute_md5_hex(content)).toString);
    components_to_sign.push(content_type.toString());
    components_to_sign.push(date.toString());
    components_to_sign.push(request_path.toString());
    let string_to_sign = components_to_sign.join("\n");
    let signature = this.compute_hmac_base64(secret_key, string_to_sign);
    let auth_header = "VWS "+access_key+":"+signature; //%s:%s" % (access_key, signature)
    return auth_header
  }

  encode_multipart_formdata(fields, files){
    let BOUNDARY = '----------ThIs_Is_tHe_bouNdaRY_$'
    let CRLF = '\r\n';
    let lines = [];
    for(var i=0;i<fields.length;i++){
      lines.push('--' + BOUNDARY);
      if(i=0){
        lines.push('Content-Disposition: form-data; name=' + 'include_target_data');
        lines.push('');
        lines.push(fields['include_target_data']);
      } else if(i=1){
        lines.push('Content-Disposition: form-data; name=' + 'max_num_results');
        lines.push('');
        lines.push(fields['max_num_results']);
      }
    }

    lines.push('--' + BOUNDARY)
    lines.push('Content-Disposition: form-data; name='+files[0]+'; filename=' +files[1]);
    lines.push('Content-Type: ' + this.get_content_type(files[1]));
    lines.push('');
    lines.push(files[2]);
    
    
    lines.push('--' + BOUNDARY + '--');
    lines.push('');
    let body = lines.join(CRLF);
    let content_type = 'multipart/form-data; boundary=' + BOUNDARY;
    return [content_type, content_type];
  }

  get_content_type(filename){
    let fileType = mime.lookup(filename);
    if(fileType){
      return fileType;
    } else {
      return 'application/octet-stream';
    }

    // return mimetypes.guess_type(filename)[0] or 'application/octet-stream';
  }
    
   send_query(access_key, secret_key, max_num_results, include_target_data, image){
    let http_method = 'POST';
    let date = new Date();//formatdate(None, localtime=False, usegmt=True)

    let path = "/v1/query"

    // # The body of the request is JSON and contains one attribute, the instance ID of the VuMark
    // with open(image, 'rb') as f:
    //     imagedata = f.read()
    let imageBlob = localStorage.getItem('imageBlob64');
    let imagedata = imageBlob; // from camera or gallery

    let content_type  = this.encode_multipart_formdata([{'include_target_data':include_target_data}, {'max_num_results': max_num_results}], ['image', image, imagedata])[0]
    let request_body =  this.encode_multipart_formdata([{'include_target_data':include_target_data}, {'max_num_results': max_num_results}], ['image', image, imagedata])[1]
    let content_type_bare = 'multipart/form-data'

    // # Sign the request and get the Authorization header
    let auth_header = this.authorization_header_for_request(access_key, secret_key, http_method, request_body, content_type_bare, date, path);


    let headers = new Headers({
        'Accept': 'application/json',
        'Authorization': auth_header,
        'Content-Type': content_type,
        'Date': date
      })
  
    let url = 'https://cloudreco.vuforia.com:443'+ path;
    let options = new RequestOptions({headers: headers });
      // let body = {"book": "btc_cad", "direction": "buy", "amount": amount, "currency": currency};
      this.http.post(url,request_body,options)
        .map(res => res.json()).subscribe((response: any) => {
           console.log(response);
           return [response.status, response]
        },
        err => { 
          //alert('Invalid ID or Password!!!');
          console.log(err);
        });
  
    

    // # Make the request over HTTPS on port 443
    // http = httplib.HTTPSConnection(CLOUD_RECO_API_ENDPOINT, 443)
    // http.request(http_method, path, request_body, request_headers)

    // response = http.getresponse()
    // response_body = response.read()
   }
}
