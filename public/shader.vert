uniform float currentTime;
attribute float startTime; // this particle's spawn time (update each cycle)
attribute float size;
varying vec3 vColor; // brightness of particle (to be used in fragment stage)
varying float angle; // rotation of the particle
varying float squish;
varying float t;
varying float lifeTime;

uniform float baseSize;

uniform float shapeRandSize;
uniform float shapeRandProportions;
uniform vec3 color;
uniform float colorRandH;
uniform float colorRandS;
uniform float colorRandL;
uniform float effectScaleOut;
uniform float effectBeat;
uniform float effectSpread;
uniform float effectSpiral;

float remap(float value, float minSrc, float maxSrc, float minDst, float maxDst) {
    return minDst + (value - minSrc) * (maxDst - minDst) / (maxSrc - minSrc);
}

float cubicInOut(float t){ // convert 0-1 linear to cubic (in/out)
    if(t < .5){
        return 4. * t * t * t;
    }else{
        float f = ((2. * t) - 2.);
        return .5 * f * f * f + 1.;
    }
}

float random(float seed){ // simple seeded random
    return fract(sin(seed) * 43758.5453123);
}

float centerRemap(float v, float center){ // linear 0-1 to lin 0-1-0, with arbitrary 'center' position
    if(v < center){
        return v/center;
    }else{
        return remap(v, center, 1., 1., 0.);
    }
}

// Function to convert RGB to HSL
vec3 rgbToHsl(vec3 rgb) {
    float r = rgb.r;
    float g = rgb.g;
    float b = rgb.b;
    float max = max(max(r, g), b);
    float min = min(min(r, g), b);
    float h, s, l = (max + min) / 2.0;

    if (max == min) {
        h = s = 0.0;
    } else {
        float d = max - min;
        s = l > 0.5 ? d / (2.0 - max - min) : d / (max + min);
        if (r > g && r > b) {
            h = (g - b) / d + (g < b ? 6.0 : 0.0);
        } else if (g > r && g > b) {
            h = (b - r) / d + 2.0;
        } else {
            h = (r - g) / d + 4.0;
        }
        h /= 6.0;
    }

    return vec3(h, s, l);
}

// Helper function for HSL to RGB conversion
float hslToRgbHelper(float p, float q, float t) {
    if (t < 0.0) t += 1.0;
    if (t > 1.0) t -= 1.0;
    if (t < 1.0 / 6.0) return p + (q - p) * 6.0 * t;
    if (t < 1.0 / 2.0) return q;
    if (t < 2.0 / 3.0) return p + (q - p) * (2.0 / 3.0 - t) * 6.0;
    return p;
}

// Function to convert HSL to RGB
vec3 hslToRgb(vec3 hsl) {
    float h = hsl.x;
    float s = hsl.y;
    float l = hsl.z;
    float r, g, b;

    if (s == 0.0) {
        r = g = b = l;
    } else {
        float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
        float p = 2.0 * l - q;
        r = hslToRgbHelper(p, q, h + 1.0 / 3.0);
        g = hslToRgbHelper(p, q, h);
        b = hslToRgbHelper(p, q, h - 1.0 / 3.0);
    }

    return vec3(r, g, b);
}

// Function to adjust RGB color using HSL values
vec3 adjustRgbWithHsl(vec3 rgb, float hue, float saturation, float lightness) {
    vec3 hsl = rgbToHsl(rgb);
    hsl.x = mod(hsl.x + hue, 1.);
    hsl.y = clamp(hsl.y + saturation, 0., 1.);
    hsl.z = clamp(hsl.z + lightness, 0., 1.);
    return hslToRgb(hsl);
}

const float inTime = .2; // particle scale-in animation duration (0-1)
const float horizontalAmount = .5; // flying away from cursor horizontally

void main(){
    lifeTime = random(startTime+10.)*10. + 5.;
    t = startTime < 0. ? 0. : currentTime-startTime; // 0-1

    float horDirection = remap(random(startTime+20.), 0., 1., -horizontalAmount, horizontalAmount); // random horizontal direction on spawn
    float horMultiplier = 1. - pow(1. - (t / (lifeTime*.7) ), 3.); // imitating a horizontal force by using the particle's age to multiply horDirection with
    vec4 mvPosition = modelViewMatrix * vec4(position+(horDirection * horMultiplier * effectSpread), 1.0); // x is horizontal force, y is falling down
    gl_Position = projectionMatrix * mvPosition;

    float fluctuatingSize = sin(t*4. + random(startTime+30.)*6.)/4.+.75; // a fluctuating scale between .5-1
    // absolute value between 0.5 and 1/-1, from 0 to 1
    float scaleEffect = abs(effectScaleOut * 2. - 1.);
    float particleInOutScale = t > inTime ? mix(1., pow(remap(t, 0., lifeTime, 1., effectScaleOut > 0.5 ? 3. : 0.), 2.), scaleEffect) : cubicInOut(t/inTime);

    // default size and and random size and scale in/out
    gl_PointSize = mix(1., size, shapeRandSize) * (baseSize / -mvPosition.z) * particleInOutScale;

    // beat effect
    gl_PointSize = mix(gl_PointSize, gl_PointSize * fluctuatingSize, effectBeat);

    // randomize color
    float randH = random(startTime+70.); // 0 - 1
    float randS = random(startTime+80.) * 2. - 1.; // -1 - 1
    float randL = random(startTime+90.) * 2. - 1.; // -1 - 1
    vColor = adjustRgbWithHsl(color, mix(0., randH, pow(colorRandH, 2.)), mix(0., randS, pow(colorRandS, 2.)), mix(0., randL, pow(colorRandL, 2.)));

    // first random value decides how different subsequent rotations are
    // second one decides speed of rotation
    // third one makes some rotate the other way
    angle = (random(startTime+40.) * 3.) + currentTime * (random(startTime+50.) * 1.) * (size > 1. ? -1. : 1.);
    squish = random(startTime+60.) * 3.;
}