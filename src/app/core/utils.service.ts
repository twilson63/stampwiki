import { Injectable } from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import { marked } from 'marked-latest';
import DOMPurify from 'dompurify';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {
  constructor(
    private _snackBar: MatSnackBar,) { }

  /*
  *  Custom snackbar message
  */
  message(msg: string, panelClass: string = '', verticalPosition: any = undefined) {
    this._snackBar.open(msg, 'X', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: verticalPosition,
      panelClass: panelClass
    });
  }

  /*
  *  Words per minute:
  *  The definition of each "word" is often standardized to be five characters 
  *  or keystrokes long in English.
  *  The number of characters per minute tends to be around 1000. 
  *  https://en.wikipedia.org/wiki/Words_per_minute#Reading_and_comprehension
  */
  getReadingTime(s: string) {
    /*
    // Method 1:
    // Using The number of characters per minute tends to be around 1000. 
    const avgcpm = 1000;
    const sc = s.length;
    const minutes = sc / avgcpm;
    */
    // Method 2:
    // Average speed 184 wpm
    const avgwpm = 184;
    const wordsize = 5;
    const sc = s.length;
    const numwords = Math.round(sc / wordsize);
    const minutes = numwords / avgwpm;

    return minutes;
  }

  minutesToMinSec(m: number): {minutes: number, seconds: number} {
    const minutes = Math.floor(m);
    const seconds = Math.round((m - minutes) * 60);

    return { minutes, seconds };
  }

  timestampToDate(_time: number) {
    let d = new Date(_time * 1000);
    return d;
  }

  /*
  *  @dev Sanitize HTML
  */
  markdownToHTML(_markdown: string) {
    var html = marked.parse(_markdown);
    var clean = DOMPurify.sanitize(html);
    return clean;
  }

  /*
  *  @dev Remove HTML
  */
  removeHTMLfromStr(_html: string) {
    return DOMPurify.sanitize(_html, {ALLOWED_TAGS: []});
  }
  
  underscoreToSpace(_s: string) {
    return _s.replace(/[_]/gi, ' ');
  }

  ellipsis(s: string, minLength=12, sliceLength=5) {
    if (!s || typeof s !== 'string') {
      return '';
    }

    return s && s.length < minLength ? s : `${s.substring(0, sliceLength)}...${s.substring(s.length - sliceLength, s.length)}`;
  }

  validateImageMIMEType(type: string) {
    const validMIME = [
      'image/bmp', 'image/jpeg', 'image/x-png',
      'image/png', 'image/gif'
    ];
    return (validMIME.indexOf(type) >= 0);
  }

  cloneObject(obj: any) {
    return JSON.parse(JSON.stringify(obj));
  }

}
