uniform sampler2D tex;
varying vec3 vColor; // get fluctuating brightness amount
varying float angle; // rotation of the particle
varying float squish;
varying float t;
varying float lifeTime;

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

void main(){
    vec2 coord = gl_PointCoord;

    // apply rotation
    float sin_factor = sin(angle);
    float cos_factor = cos(angle);
    coord = (coord - 0.5) * mat2(cos_factor, sin_factor, -sin_factor, cos_factor);
    coord += 0.5;

    // apply scale
    float logged = pow(shapeRandProportions, 2.);
    vec2 scale = vec2(1, logged * squish + 1.);
    vec2 offset = vec2(0,  logged * -(squish / 2.));
    coord = coord * scale + offset;

    gl_FragColor = texture2D(tex, coord); // get texture color
    gl_FragColor.rgb *= vColor;
    //gl_FragColor.rgb *= pow(vColor, 6.)*1.2 + 1.; // apply fluctuating brightness to texture

    if ( t == 0. || t > lifeTime) {
        gl_FragColor.a = 0.;
    } else {
        // fade out over lifetime. sert max opacity
        gl_FragColor.a *= t > lifeTime ? 0. : pow(remap(t, 0., lifeTime, .9, 0.), 2.);
    }
}
    