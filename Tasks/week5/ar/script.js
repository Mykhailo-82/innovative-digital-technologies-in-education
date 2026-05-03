const day = 24.0 * 60 * 60; //тривалість земного дня у секундах
const AR_SCALE = 3e11;      // реальні метри → одиниці A-Frame; Земля ~5 см від Сонця

AFRAME.registerComponent('planet', {
    schema: {
        name: { type: 'string', default: "" },       //ім'я планети
        dist: { type: 'number', default: 0 },        //середня відстань планети від Сонця
        mass: { type: 'number', default: 0 },        //маса планети, кг
        T: { type: 'int', default: 0 },              //планетарний рік, земних днів
        v: { type: 'array', default: [0, 0, 0] },    //вектор швидкості
        a: { type: 'array', default: [0, 0, 0] },    //вектор прискорення
        pos: { type: 'array', default: [0, 0, 0] }   //координатний радіус-вектор
    },

    init: function () {
        this.data.pos = [this.data.dist, 0, 0];  //новий масив координат для цієї планети
        this.data.v = [0, 0, 0];                 //новий вектор швидкості
        this.data.a = [0, 0, 0];                 //нове прискорення
        this.data.T *= day;                      //переводимо із земних днів у секунди
        if (this.data.T !== 0)                   //для всіх об'єктів, крім Сонця,
            this.data.v[2] = 2 * Math.PI * this.data.dist / this.data.T; //початкова швидкість вздовж z (горизонтальна орбіта)
        this.el.setAttribute('position', this.data.dist / AR_SCALE + ' 0 0'); //візуальна позиція на маркері
    }

});

AFRAME.registerComponent('main', {
    init: function () {
        this.solar_system = document.querySelectorAll('[planet]');
        this.running = false;
        const targetEl = document.querySelector('[mindar-image-target]');
        targetEl.addEventListener('targetFound', () => { this.running = true; });
        targetEl.addEventListener('targetLost', () => { this.running = false; });
    },

    tick: function (time, timeDelta) {
        if (!this.running) return;
        const dt = day / 3;      //крок інтегрування
        const G = 6.67e-11;      //гравітаційна стала
        for (let i = 0; i < this.solar_system.length; i++) {
            let planet_i = this.solar_system[i].getAttribute('planet');

            planet_i.a[0] = planet_i.a[1] = planet_i.a[2] = 0;

            for (let j = 0; j < this.solar_system.length; j++) {
                let planet_j = this.solar_system[j].getAttribute('planet');
                if (i != j) {
                    let deltapos = [0, 0, 0];
                    for (let k = 0; k < 3; k++)
                        deltapos[k] = planet_j.pos[k] - planet_i.pos[k];

                    var r = Math.sqrt(Math.pow(deltapos[0], 2) + Math.pow(deltapos[1], 2) + Math.pow(deltapos[2], 2));
                    for (let k = 0; k < 3; k++)
                        planet_i.a[k] += G * planet_j.mass * deltapos[k] / Math.pow(r, 3);
                }
            }

            for (let k = 0; k < 3; k++)
                planet_i.v[k] += planet_i.a[k] * dt;

            for (let k = 0; k < 3; k++)
                planet_i.pos[k] += planet_i.v[k] * dt;

            this.solar_system[i].setAttribute('position', (planet_i.pos[0] / AR_SCALE) + ' ' + (planet_i.pos[1] / AR_SCALE) + ' ' + (planet_i.pos[2] / AR_SCALE));
        }
    }
});

