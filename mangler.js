function obfuscateOnce(
  obfuscated,
  key,
  prime,
  offset
){
  var inverse = 1,
      power = prime - 2,
      out = '',
      idx = obfuscated.length;

  // Simple loop to find multiplicative inverse of given key mod prime
  // Euler method or something similar might be more efficient
  // (though tbh I'm too lazy to figure it out), but this is easier
  do{
    if( power & 1 ) inverse = (inverse * key) % prime;
    key = (key * key) % prime;
  }while(power = power >> 1)

  while(idx--){
    // Possibly one or two of the "% prime"s are redundant. But this works.
    out += String.fromCharCode(
             (((obfuscated.charCodeAt(idx) - offset) % prime + prime)
             * inverse - (obfuscated.length - idx - 1) % prime + prime)
             % prime + offset
           );
  }
  return out;
}

// inverse of obfuscateOnce, funnily enough.
// This is the shorter of the two because it's the one that's
// compiled into the final output, so needs to be small
// This function isn't actually used here, only included for information's sake
function deObfuscateOnce(
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
             ((input.charCodeAt(idx) - offset + idx) * key) % prime + offset
           );
  }
  return out;
}

function mangle(original, iterations){
  iterations = iterations || 5;
  var somePrimes = [29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257];

  // Wonder what this function does?
  function firstPrimeAbove(n){
    var i = somePrimes.length;
    while(somePrimes[--i] > n);
    return somePrimes[++i];
  }

  // escapes out nasty characters, but preserves as many as possible
  function sanitize(str){
    return str.replace(
      /([^a-zA-Z0-9`!\$%\^\*\(\)\-_\+=\[\]\{\};'#:@~,\.\/<>\?\|])/g,
      function(a){
        if(a=='"'||a=='\\')
          // This is going into a string with double quotes, so escape those
          return'\\'+a;
        else if(a==' ')
          return a;
        else if(a=='\t')
          return '\\t';
        else if(a=='\r')
          return '\\r';
        else if(a=='\n')
          return '\\n';
        else return '\\x'+((256+a.charCodeAt(0))&0x1ff).toString(16).slice(1)
      }
    );
  }

  // Yes, adding extra evals is bad. But this immediately brings
  // our character range into something much more sensible.
  original = 'eval("' + sanitize(original) + '")';

  // Need a function closure to avoid requiring global function g
  var before = '(function(g){';
  // Compiled version of deObfuscateOnce above. Admittedly this is with eval rather than return but hey.
  var after = '})(function(a,b,c,d,e,f,g){for(;e--;)f+=String.fromCharCode(((a.charCodeAt(e)+e-d)*b)%c+d);eval(f)})';

  // Do this here because we need to know how big our final character set will be.
  var charRange = before + after + original + '"';
  var min = 5000, max = 0;

  // Loop through and find the min and max character codes. This way we're multiplying
  // in the smallest prime field possible, and increase the likelihood that most characters
  // obtained can be represented in the resulting string without excape sequences.
  for(var i = charRange.length;i--;){
    min = Math.min(min, charRange.charCodeAt(i));
    max = Math.max(max, charRange.charCodeAt(i));
  }
  // Try to avoid multiplying by 0, because that's boring. Come to think of it though,
  // this might not be necessary any more
  min -= 1;

  // Figure out the size of our prime field.
  var p = firstPrimeAbove( max - min );

  while(iterations--){
    // Pick a random multiplier. These numbers are fairly arbitrary.
    // Only important thing is that we're not multiplying by 0, and preferably
    // not by 1 either.
    var multiplier = 0|5+Math.random()*20;
    var newText = sanitize(obfuscateOnce( original, multiplier, p, min));

    // There's probably a nicer way to do this without eval, but for some reason
    // whatever else I tried gave the wrong length.
    var newLength = (eval('"' + newText + '"')).length;

    // Wrap it up and include the various arguments for the next iteration.
    original = 'g("' + newText + '",' + [multiplier, p, min, newLength, '""'] + ',g)';
  }

  return before + original + after
}
