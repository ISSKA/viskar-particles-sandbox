import { Color } from "three";

export enum ContaminantDesignShape {
  Circular = "Circular",
  Angular = "Angular",
  Clouds = "Clouds",
  Abstract = "Abstract",
}

export const ShapeToTexture: { [x in ContaminantDesignShape]: string } = {
  Circular: "/textures/circle.png",
  Angular: "/textures/angular.png",
  Clouds: "/textures/clouds.png",
  Abstract: "/textures/abstract.png",
};

export interface ContaminantDesign {
  shape: ContaminantDesignShape;
  shapeRandSize: number;
  shapeRandProportions: number;
  color: Color;
  colorRandH: number;
  colorRandS: number;
  colorRandL: number;
  effectScaleOut: number;
  effectBeat: number;
  effectSpread: number;
  effectSpiral: number;
}
