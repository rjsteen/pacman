import Ember from 'ember';

export default Ember.Object.extend({
  // 0 is a blank space
  // 1 is a well
  // 2 is a pellet
  layout: [
    [2,2,2,2,2,2,2,1],
    [2,1,2,1,2,2,2,1],
    [2,2,1,2,2,2,2,1],
    [2,2,2,2,2,2,2,1],
    [2,2,2,2,2,2,2,1],
    [1,2,2,2,2,2,2,1]
  ],

  startingPac: {
    x: 2,
    y: 1
  },
  startingGhosts: [{
    x: 0,
    y: 0
  }, {
    x: 5,
    y: 0
  }],

  squareSize: 40,
  width: Ember.computed(function(){
    return this.get('grid.firstObject.length');
  }),
  height: Ember.computed(function(){
    return this.get('grid.length');
  }),
  pixelWidth: Ember.computed(function(){
    return this.get('width') * this.get('squareSize');
  }),
  pixelHeight: Ember.computed(function(){
    return this.get('height') * this.get('squareSize');
  }),

  isComplete(){
    let hasPelletsLeft = false;
    let grid = this.get('grid');

    grid.forEach((row)=>{
      row.forEach((cell)=>{
        if(cell == 2){
          hasPelletsLeft = true;
        }
      });
    });
    return !hasPelletsLeft;
  },

  restart(){
    var newGrid = jQuery.extend(true, [], this.get('layout'));
    this.set('grid', newGrid);
  }
});
