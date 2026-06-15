



const state = {
  classes: [],
  layers: [],
  model: null,
  stopFlag: false,
  inferStream: null,
  inferInterval: null
};

let cameraOverlayStream = null;
let activePhotoClassId = null;


// Stage 2 layers cards info
const LAYER_META = {
  Input:      { icon: '\uf04b', faIcon: 'fa-play',          color: 0x4dffb4, label: 'Input',      sub: '256×256×3' },
  Conv2D:     { icon: '\uf00a', faIcon: 'fa-th',            color: 0x7c6aff, label: 'Conv2D',     sub: 'Згортка' },
  MaxPool:    { icon: '\uf063', faIcon: 'fa-arrow-down',    color: 0xff6a9e, label: 'MaxPool2D',  sub: 'Пулінг' },
  Flatten:    { icon: '\uf337', faIcon: 'fa-arrows-alt-h',  color: 0xffcc4d, label: 'Flatten',    sub: 'Розгорнути' },
  Dense:      { icon: '\uf111', faIcon: 'fa-circle',        color: 0x6affd4, label: 'Dense',      sub: "Повнозв'язний" },
  Activation: { icon: '\uf83e', faIcon: 'fa-wave-square',   color: 0xff9e6a, label: 'Activation', sub: 'Функція' },
  Output:     { icon: '\uf0c8', faIcon: 'fa-square',        color: 0xff6a9e, label: 'Output',     sub: 'Класифікація' }
};

let arRenderer = null, arScene = null, arCamera = null;

let arSession = null, arRefSpace = null, arHitTestSource = null;

let arSceneGroup = null, arReticleGroup = null;

let arCards = [],
    selectedCardIdx = null,
    editingCardIdx = null,
    xrMode = null,
    arPlaced = false;

let longPressTimer = null, longPressIdx = -1;

let wasFullscreenBeforeXR = false;

const CARD_W = 0.18,
      CARD_H = 0.11,
      CARD_GAP = 0.045,
      COLS = 3;