
export function getMidiToFreqArray(){
  let midi = [];
    let exp = null;
    const a = 440; // a is 440 hz...
    for (let x = 0; x < 127; x++)
    {
      exp =  ((x - 9) / 12);
      midi[x] =  (a / 32) * Math.pow(2, exp);
    }
    return midi;
}

