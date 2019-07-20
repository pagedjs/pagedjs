/* 
Get generated content into ::before and ::after elements
Utils for string-sets and target-text properties

counter = OK
string = OK
attr = TO-DO
*/

export function getGeneratedContent(content, elem){
    let cssVar;
	let contentCounter = content.match(/counter\((.*?)\)\s?/g);
	if(contentCounter !== null){
		for(let i = 0; i < contentCounter.length; i++){
			let counter = contentCounter[i].replace(/\s?counter\(/g, '').replace(/\)\s?/g, '').split(',');
			let counterName = counter[0];
			let valueCounter = elem.getAttribute('data-counter-' + counterName + '-value');
			let counterTypeElem;	
			if(counter[1] !== undefined){ 
				counterTypeElem = counter[1].replace(/\s/g, ''); 
			} else { 
				counterTypeElem = 'decimal'; 
			}
											
			let newCounter = counterType(valueCounter, counterTypeElem);
			cssVar = content.replace(contentCounter[i], newCounter).replace(/"/g, '');
		}
	}else{
		cssVar = content.replace(/"/g, '');
	}
	return cssVar;
}



/* Functions for counterType ----------------------------------------------------------------- 
----------------------------------------------------------------------------------------------*/

function counterType(element, type) {
	if (!type) {
		return;
    }
    let newCounter;
    let number = parseInt(element, 10);
	if(type === 'upper-roman') {
		newCounter = upperRoman(number);
	} else if(type === 'lower-roman'){
		newCounter = lowerRoman(number);
    } else if(type === 'decimal-leading-zero') {
        newCounter = leadingZero(number);
    } else if(type === 'lower-alpha' || type ==='lower-latin'){
        newCounter = lowerLatin(number);
    } else if(type === 'upper-alpha' || type ==='upper-latin'){
        newCounter = upperLatin(number);
    } else {
        newCounter = element;
    }
	return newCounter;
}


function leadingZero(num){
    var result;
    if(num == 1 || num == 2 || num == 3 || num == 4 || num == 5 || num == 6 || num == 7 || num == 8 || num == 9|| num == 0){
        result = '0' + num;
    } else {
        result = num;
    }
    return result;
}

/**
 * based on: https://www.selftaughtjs.com/algorithm-sundays-converting-roman-numerals/
 */
function upperRoman(num) {  
    var result = '';
    var decimal = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
    var roman = ["M", "CM","D","CD","C", "XC", "L", "XL", "X","IX","V","IV","I"];
    for (var i = 0;i<=decimal.length;i++) {
      while (num%decimal[i] < num) {     
        result += roman[i];
        num -= decimal[i];
      }
    }
    return result;
  }


function lowerRoman(num) {  
    var result = '';
    var decimal = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
    var roman = ["m", "cm","d","cd","c", "xc", "l", "xl", "x","ix","v","iv","i"];
    for (var i = 0;i<=decimal.length;i++) {
      while (num%decimal[i] < num) {     
        result += roman[i];
        num -= decimal[i];
      }
    }
    return result;
  }



/**
 * based on: https://stackoverflow.com/questions/45787459/convert-number-to-alphabet-string-javascript/45787487 
 * String.fromCharCode() method returns a string created from the specified sequence of UTF-16 code units
 */
function lowerLatin(num){
    var s = '', t;

  while (num > 0) {
    t = (num - 1) % 26;
    s = String.fromCharCode(97 + t) + s;
    num = (num - t)/26 | 0;
  }
  return s || undefined;

}

function upperLatin(num){
    var s = '', t;

  while (num > 0) {
    t = (num - 1) % 26;
    s = String.fromCharCode(65 + t) + s;
    num = (num - t)/26 | 0;
  }
  return s || undefined;

}

