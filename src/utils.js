Array.prototype.joinConjunct =
  Array.prototype.joinConjunct ||
  function (joiner, lastJoiner, nonOxford) {
    if (this.length === 0) return '';
    if (this.length === 1) return this[0];
    if (this.length === 2) return this.join(lastJoiner);
    else {
      let outStr = '';
      for (let i = 0; i < this.length; ++i) {
        outStr += this[i];
        if (i < this.length - 2) outStr += joiner;
        else if (i === this.length - 2)
          outStr += `${
            !nonOxford && this.length > 2 ? joiner.trim() : ''
          }${lastJoiner}`;
      }
      return outStr;
    }
  };
