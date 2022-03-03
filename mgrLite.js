import glob from "glob";
import {handleFile} from './js/oldCode.cjs';


glob("**/*.xls", function (er, files) {
    //console.log(files);
    for (const file in files) {
        handleFile(files[file]);
    }
});
