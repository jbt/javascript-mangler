   function deObfuscate(
      input,
      key,
      prime,
      offset,
      idx,
      out
    ){
      out = '';
      idx = input.length;
      while(idx--){
        out += String.fromCharCode(
          ((input.charCodeAt( idx ) - offset + idx)
          * key)
          % prime
          + offset
        );
      }
      return out;
    }

    function obfuscateOnce(
      cipher,
      key,
      prime,
      offset,
      idx,
      out,
      inverse,
      power
    ){
      inverse = 1;
      power = prime - 2;
      do{ // euclid would probably be quicker but key ^ (prime-2) is simple
        if(power & 1) inverse = (inverse * key) % prime;
        key = (key * key) % prime;
      }while(power = power >> 1);
      out = '';
      idx = cipher.length;
      while(idx--){
        out += String.fromCharCode(
          (((cipher.charCodeAt( idx )- offset ) % prime + prime )
          * inverse - (cipher.length - idx - 1)%prime + prime)
          % prime
          + offset
        );
      }
      return out;
    }

    // Compiled version of deObfuscate above
    var deObfuscateFunction = "function(c,e,f,d,a,b,x){for(;a--;)b+=String.fromCharCode(((c.charCodeAt(a)+a-d)*e)%f+d);eval(b)}";

    var plaintext = "document.write('<a href=\"mailto:someone@example.com\">Here is a rather obfuscated email link</a>, and just for good measure here is some pointless random extra text!');";
    //var plaintext = "abcdef";

    var min = 500, max = 0;
    for(var l = 0; l < plaintext.length; l += 1){
      min = Math.min(min, plaintext.charCodeAt(l));
      max = Math.max(max, plaintext.charCodeAt(l));
    }

    var somePrimes = [29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257];

    function firstPrimeAbove(n){
      for(var i = 0; i < somePrimes.length; i+=1) if(somePrimes[i] > n) return somePrimes[i];
    }

    min -= 1;
    // choose the smallest prime possible so we don't end up with a gazillion invisible/weird characters
    var p = firstPrimeAbove(max - min);

    var iterations = 5;

    while(iterations--){
      var exponent = ~~(5+Math.random()*20);
      var newText = (obfuscateOnce(plaintext, exponent, p, min)).replace(/([^a-zA-Z0-9\$\^\&\*\.\-\_\=\+\;\:\'\#\~\{\}\[\]\(\)\$\?\!\/\s\`\|\<\>\@,%])/g, function(a){if(a=='"'||a=='\\')return '\\'+a; else return '\\x'+((256+a.charCodeAt(0))&0x1ff).toString(16).slice(1)});
      var ntl = eval('"' + newText + '"').length;
      plaintext = 'x("' + newText + '",'+[exponent,p,min,ntl,'""'] +',x)';
    }

    plaintext = '(function(x){' + plaintext + '})(' + deObfuscateFunction + ');';

    console.log(plaintext);

    console.log(plaintext.length);

    eval(plaintext);



