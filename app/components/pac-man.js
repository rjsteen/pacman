import Ember from 'ember';
import KeyboardShortcuts from 'ember-keyboard-shortcuts/mixins/component';
import GridInfo from '../mixins/grid-info';
import Pac from '../models/pac';
import Level from '../models/level';
import Level2 from '../models/level2';
import TeleportLevel from '../models/teleport-level';
import Ghost from '../models/ghost';

export default Ember.Component.extend(KeyboardShortcuts, GridInfo, {
  didInsertElement() {
    this.startNewLevel();
    this.loop();
  },

  startNewLevel(){
    let level = this.loadNewLevel();
    level.restart();
    this.set('level', level);

    let pac = Pac.create({
      level: level,
      x: level.get('startingPac.x'),
      y: level.get('startingPac.y')
    });

    this.set('pac', pac);

    let ghosts = level.get('startingGhosts').map((startingPosition)=>{
      return Ghost.create({
        level: level,
        x: startingPosition.x,
        y: startingPosition.y,
        pac: pac
      });
    });

    this.set('ghosts', ghosts);
  },

  levels: [TeleportLevel, Level, Level2],
  score: 0,
  levelNumber: 1,
  lives: 3,

  loadNewLevel(){
    let levelIndex = (this.get('levelNumber') - 1) % this.get('levels.length');
    let levelClass = this.get('levels')[levelIndex];
    return levelClass.create();
  },

  drawWall: function(x, y){
    let ctx = this.get('ctx');
    let squareSize = this.get('level.squareSize');

    ctx.fillStyle = '#000';
    ctx.fillRect(x * squareSize,
                 y * squareSize,
                 squareSize,
                 squareSize);
  },

  drawGrid: function(){
    let grid = this.get('level.grid');
    grid.forEach((row, rowIndex)=>{
      row.forEach((cell, columnIndex)=>{
        if(cell === 1){
          this.drawWall(columnIndex, rowIndex);
        }
        if(cell === 2){
          this.drawPellet(columnIndex, rowIndex);
        }
        if(cell === 3){
          this.drawPowerPellet(columnIndex, rowIndex);
        }
      });
    });
  },

  drawPellet(x, y){
    let radiusDivisor = 6;
    this.drawCircle(x, y, radiusDivisor, 'stopped');
  },

  drawPowerPellet(x, y){
    let radiusDivisor = 4;
    this.drawCircle(x, y, radiusDivisor, 'stopped', 'green');
  },

  clearScreen: function() {
    let ctx = this.get('ctx');
    ctx.clearRect(0, 0, this.get('level.pixelWidth'), this.get('level.pixelHeight'));
  },

  loop(){
    this.get('pac').move();
    this.get('ghosts').forEach(ghost => ghost.move());

    this.processAnyPellets();

    this.clearScreen();
    this.drawGrid();
    this.get('pac').draw();
    this.get('ghosts').forEach(ghost => ghost.draw());

    let ghostCollisions = this.detectGhostCollisions();
    if(ghostCollisions.length > 0){
      if(this.get('pac.powerMode')){
        ghostCollisions.forEach(ghost => ghost.retreat());
      } else {
        this.decrementProperty('lives');
        this.restart();
      }
    }

    Ember.run.later(this, this.loop, 1000/60);
  },

  processAnyPellets(){
    let x = this.get('pac.x');
    let y = this.get('pac.y');
    let grid = this.get('level.grid');

    if(grid[y][x] === 2){
      grid[y][x] = 0;
      this.incrementProperty('score');

      if(this.get('level.isComplete()')){
        this.incrementProperty('levelNumber');
        this.startNewLevel();
      }
    } else if(grid[y][x] === 3){
        grid[y][x] = 0;
        this.set('pac.powerModeTime', this.get('pac.maxPowerModeTime'));
    }
  },

  restart(){
    if(this.get('lives') <= 0) {
      this.set('score', 0);
      this.set('lives', 3);
      this.set('levelNumber', 1);
      this.startNewLevel();
    }
    this.get('pac').restart();
    this.get('ghosts').forEach(ghost => ghost.restart());
  },

  keyboardShortcuts: {
    up() { this.set('pac.intent', 'up');},
    down() { this.set('pac.intent', 'down');},
    left() { this.set('pac.intent', 'left');},
    right() { this.set('pac.intent', 'right');}
  },

  isMoving: false,

  changePacDirection(){
    let intent = this.get('pac.intent');
    if(this.pathBlockedInDirection(intent)){
      this.set('pac.direction', 'stopped');
    } else {
      this.set('pac.direction', intent);
    }
  },

  nextCoordinate(coordinate, direction){
    let next = this.get(coordinate) + this.get(`directions.${direction}.${coordinate}`);
    if(this.get('level.teleport')) {
      if(direction === 'up' || direction === 'down'){
        return this.modulo(next, this.get('level.height'));
      } else {
        return this.modulo(next, this.get('level.width'));
      }
    } else {
      return next;
    }
  },

  modulo(num, mod){
    return ((num + mod) % mod);
  },

  offsetFor(coordinate, direction){
    let frameRatio = this.get('frameCycle') / this.get('framesPerMovement');
    return this.get(`directions.${direction}.${coordinate}`) * frameRatio;
  },

  pathBlockedInDirection(direction){
    let cellTypeInDirection = this.cellTypeInDirection(direction);
    return Ember.isEmpty(cellTypeInDirection) || cellTypeInDirection === 1;
  },

  cellTypeInDirection(direction){
    let nextX = this.nextCoordinate('x', direction);
    let nextY = this.nextCoordinate('y', direction);

    return this.get(`level.grid.${nextY}.${nextX}`);
  },

  detectGhostCollisions(){
    return this.get('ghosts').filter((ghost)=>{
      return (this.get('pac.x') == ghost.get('x') &&
              this.get('pac.y') == ghost.get('y'))
    });
  }
});
