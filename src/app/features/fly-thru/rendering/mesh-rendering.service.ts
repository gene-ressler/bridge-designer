import { Injectable } from '@angular/core';
import { Utility } from '../../../shared/classes/utility';
import {
  IN_POSITION_LOCATION,
  IN_NORMAL_LOCATION,
  IN_MATERIAL_REF_LOCATION,
  IN_INSTANCE_MODEL_TRANSFORM_LOCATION,
  IN_TEX_COORD_LOCATION,
} from '../shaders/constants';
import { ShaderService } from '../shaders/shader.service';
import { GlService } from './gl.service';
import { ImageService } from '../../../shared/core/image.service';
import { Colors } from '../../../shared/classes/graphics';
import { FACIA_TEXTURE_UNIT, WATER_TEXTURE_UNIT } from './constants';

export type MeshData = {
  positions: Float32Array;
  normals?: Float32Array;
  texCoords?: Float32Array;
  materialRefs?: Uint16Array;
  indices: Uint16Array;
  // For instanced drawing, one mat4 per instance.
  instanceModelTransforms?: Float32Array;
};

export type Mesh = {
  vertexArray: WebGLVertexArrayObject;
  texture?: WebGLTexture;
  textureUniformLocation?: WebGLUniformLocation;
  indexBuffer: WebGLBuffer;
  elementCount: number;
  // Instance count inferred from mesh data instanceModelTransforms, if any.
  instanceCount?: number;
  // For delete-able meshes.
  positionBuffer?: WebGLBuffer;
  normalBuffer?: WebGLBuffer;
  materialRefBuffer?: WebGLBuffer;
  texCoordBuffer?: WebGLBuffer;
  instanceModelTransformBuffer?: WebGLBuffer;
};

/** Container for the WebGL details of rendering meshes: one-time preparation and per-frame drawing. */
@Injectable({ providedIn: 'root' })
export class MeshRenderingService {
  constructor(
    private readonly glService: GlService,
    private readonly imageService: ImageService,
    private readonly shaderService: ShaderService,
  ) {}

  // TODO: Factor out some common sub-functions to reduce code size. See textured and colored.
  // TODO: After above, move WireRenderingService here to use the sub-functions.

  /** Prepares a colored mesh for drawing. */
  public prepareColoredMesh(meshData: MeshData): Mesh {
    const gl = this.glService.gl;

    const vertexArray = Utility.assertNotNull(gl.createVertexArray());
    gl.bindVertexArray(vertexArray);

    const positionBuffer = Utility.assertNotNull(gl.createBuffer());
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, meshData.positions, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(IN_POSITION_LOCATION);
    gl.vertexAttribPointer(IN_POSITION_LOCATION, 3, gl.FLOAT, false, 0, 0);

    const normalBuffer = Utility.assertNotNull(gl.createBuffer());
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, meshData.normals!, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(IN_NORMAL_LOCATION);
    gl.vertexAttribPointer(IN_NORMAL_LOCATION, 3, gl.FLOAT, false, 0, 0);

    const materialRefBuffer = Utility.assertNotNull(gl.createBuffer());
    gl.bindBuffer(gl.ARRAY_BUFFER, materialRefBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, meshData.materialRefs!, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(IN_MATERIAL_REF_LOCATION);
    gl.vertexAttribIPointer(IN_MATERIAL_REF_LOCATION, 1, gl.UNSIGNED_SHORT, 2, 0);

    const indexBuffer = Utility.assertNotNull(gl.createBuffer());
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, meshData.indices, gl.STATIC_DRAW);

    let instanceModelTransformBuffer;
    if (meshData.instanceModelTransforms) {
      instanceModelTransformBuffer = Utility.assertNotNull(gl.createBuffer());
      gl.bindBuffer(gl.ARRAY_BUFFER, instanceModelTransformBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, meshData.instanceModelTransforms, gl.STATIC_DRAW);
      // Vertex attributes are limited to 4 floats. This trick sends columns of 4x4. They're
      // assembled magically by the shader.
      for (let i = 0; i < 4; ++i) {
        gl.enableVertexAttribArray(IN_INSTANCE_MODEL_TRANSFORM_LOCATION + i);
        gl.vertexAttribPointer(IN_INSTANCE_MODEL_TRANSFORM_LOCATION + i, 4, gl.FLOAT, false, 64, i * 16);
        gl.vertexAttribDivisor(IN_INSTANCE_MODEL_TRANSFORM_LOCATION + i, 1);
      }
    }

    const elementCount = meshData.indices.length;
    const instanceCount = meshData.instanceModelTransforms ? meshData.instanceModelTransforms.length / 16 : 0;

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);

    return {
      vertexArray,
      indexBuffer,
      elementCount,
      instanceCount,
      positionBuffer,
      normalBuffer,
      materialRefBuffer,
      instanceModelTransformBuffer,
    };
  }

  /** Renders a previously prepared color facet mesh.  */
  public renderColoredMesh(mesh: Mesh): void {
    const gl = this.glService.gl;
    gl.useProgram(this.shaderService.getProgram(mesh.instanceCount ? 'colored_mesh_instances' : 'colored_mesh'));
    gl.bindVertexArray(mesh.vertexArray);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
    if (mesh.instanceCount) {
      gl.drawElementsInstanced(gl.TRIANGLES, mesh.elementCount, gl.UNSIGNED_SHORT, 0, mesh.instanceCount);
    } else {
      gl.drawElements(gl.TRIANGLES, mesh.elementCount, gl.UNSIGNED_SHORT, 0);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
  }

  public prepareTexturedMesh(meshData: MeshData, textureUrl: string, preloadColor: Uint8Array): Mesh {
    const gl = this.glService.gl;

    const vertexArray = Utility.assertNotNull(gl.createVertexArray());
    gl.bindVertexArray(vertexArray);

    const positionBuffer = Utility.assertNotNull(gl.createBuffer());
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, meshData.positions, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(IN_POSITION_LOCATION);
    gl.vertexAttribPointer(IN_POSITION_LOCATION, 3, gl.FLOAT, false, 0, 0);

    const normalBuffer = Utility.assertNotNull(gl.createBuffer());
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, meshData.normals!, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(IN_NORMAL_LOCATION);
    gl.vertexAttribPointer(IN_NORMAL_LOCATION, 3, gl.FLOAT, false, 0, 0);

    const texCoordBuffer = Utility.assertNotNull(gl.createBuffer());
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, meshData.texCoords!, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(IN_TEX_COORD_LOCATION);
    gl.vertexAttribPointer(IN_TEX_COORD_LOCATION, 2, gl.FLOAT, false, 0, 0);

    const indexBuffer = Utility.assertNotNull(gl.createBuffer());
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, meshData.indices, gl.STATIC_DRAW);

    const texture = Utility.assertNotNull(gl.createTexture());
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // Use a solid color texture of 1 pixel until the texture image loads.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, preloadColor);
    this.imageService.createImagesLoader([textureUrl]).invokeAfterLoaded(imagesByUrl => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imagesByUrl[textureUrl]);
      gl.generateMipmap(gl.TEXTURE_2D);
    });
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

    let instanceModelTransformBuffer;
    let programName = 'textured_mesh';
    let instanceCount = 0;
    if (meshData.instanceModelTransforms) {
      programName = 'textured_mesh_instances';
      instanceCount = meshData.instanceModelTransforms.length / 16;
      instanceModelTransformBuffer = Utility.assertNotNull(gl.createBuffer());
      gl.bindBuffer(gl.ARRAY_BUFFER, instanceModelTransformBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, meshData.instanceModelTransforms, gl.STATIC_DRAW);
      // Vertex attributes are limited to 4 floats. This trick sends columns of 4x4. They're
      // assembled magically by the shader.
      for (let i = 0; i < 4; ++i) {
        gl.enableVertexAttribArray(IN_INSTANCE_MODEL_TRANSFORM_LOCATION + i);
        gl.vertexAttribPointer(IN_INSTANCE_MODEL_TRANSFORM_LOCATION + i, 4, gl.FLOAT, false, 64, i * 16);
        gl.vertexAttribDivisor(IN_INSTANCE_MODEL_TRANSFORM_LOCATION + i, 1);
      }
    }
    const program = this.shaderService.getProgram(programName);
    const textureUniformLocation = gl.getUniformLocation(program, 'meshTexture')!;

    const elementCount = meshData.indices.length;

    return {
      vertexArray,
      indexBuffer,
      elementCount,
      instanceCount,
      texture,
      textureUniformLocation,
      positionBuffer,
      normalBuffer,
      texCoordBuffer,
    };
  }

  public renderTexturedMesh(mesh: Mesh): void {
    const gl = this.glService.gl;
    gl.useProgram(this.shaderService.getProgram(mesh.instanceCount ? 'textured_mesh_instances' : 'textured_mesh'));
    gl.bindVertexArray(mesh.vertexArray);
    // TODO: Experiment with doing this once, not once per frame. Possible because we have fewer textures than units?
    gl.uniform1i(Utility.assertNotUndefined(mesh.textureUniformLocation), FACIA_TEXTURE_UNIT);
    gl.activeTexture(gl.TEXTURE0 + FACIA_TEXTURE_UNIT);
    gl.bindTexture(gl.TEXTURE_2D, Utility.assertNotUndefined(mesh.texture));
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
    if (mesh.instanceCount) {
      gl.drawElementsInstanced(gl.TRIANGLES, mesh.elementCount, gl.UNSIGNED_SHORT, 0, mesh.instanceCount);
    } else {
      gl.drawElements(gl.TRIANGLES, mesh.elementCount, gl.UNSIGNED_SHORT, 0);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
  }

  /** Prepares a terrain mesh. */
  public prepareTerrainMesh(meshData: MeshData): Mesh {
    const gl = this.glService.gl;

    const vertexArray = Utility.assertNotNull(gl.createVertexArray());
    gl.bindVertexArray(vertexArray);

    const positionBuffer = Utility.assertNotNull(gl.createBuffer());
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, meshData.positions, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(IN_POSITION_LOCATION);
    gl.vertexAttribPointer(IN_POSITION_LOCATION, 3, gl.FLOAT, false, 0, 0);

    const normalBuffer = Utility.assertNotNull(gl.createBuffer());
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, meshData.normals!, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(IN_NORMAL_LOCATION);
    gl.vertexAttribPointer(IN_NORMAL_LOCATION, 3, gl.FLOAT, false, 0, 0);

    const indexBuffer = Utility.assertNotNull(gl.createBuffer());
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, meshData.indices, gl.STATIC_DRAW);

    const elementCount = meshData.indices.length;

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);

    return { vertexArray, indexBuffer, elementCount, positionBuffer, normalBuffer };
  }

  /** Renders a previously prepared terrain mesh.  */
  public renderTerrainMesh(mesh: Mesh) {
    const gl = this.glService.gl;
    gl.useProgram(this.shaderService.getProgram('terrain'));
    gl.bindVertexArray(mesh.vertexArray);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
    gl.drawElements(gl.TRIANGLES, mesh.elementCount, gl.UNSIGNED_SHORT, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
  }

  /** Prepares mesh for the river. */
  public prepareRiverMesh(meshData: MeshData): Mesh {
    const gl = this.glService.gl;

    const vertexArray = Utility.assertNotNull(gl.createVertexArray());
    gl.bindVertexArray(vertexArray);

    const positionBuffer = Utility.assertNotNull(gl.createBuffer());
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, meshData.positions, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(IN_POSITION_LOCATION);
    // Note x-z coordinates only. y=0 is assumed.
    gl.vertexAttribPointer(IN_POSITION_LOCATION, 2, gl.FLOAT, false, 0, 0);

    const indexBuffer = Utility.assertNotNull(gl.createBuffer());
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, meshData.indices, gl.STATIC_DRAW);

    const texture = Utility.assertNotNull(gl.createTexture());
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // Use a solid color texture of 1 pixel until the water image loads.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, Colors.GL_WATER);
    const waterUrl = 'img/water.jpg';
    this.imageService.createImagesLoader([waterUrl]).invokeAfterLoaded(imagesByUrl => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imagesByUrl[waterUrl]);
      gl.generateMipmap(gl.TEXTURE_2D);
    });
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

    const program = this.shaderService.getProgram('river');
    const textureUniformLocation = gl.getUniformLocation(program, 'water')!;

    const elementCount = meshData.indices.length;

    return { vertexArray, indexBuffer, elementCount, texture, textureUniformLocation, positionBuffer };
  }

  /** Renders the already prepared river mesh. */
  public renderRiverMesh(mesh: Mesh) {
    const gl = this.glService.gl;
    gl.useProgram(this.shaderService.getProgram('river'));
    // TODO: Experiment with doing this once, not once per frame. Possible because we have fewer textures than units?
    gl.uniform1i(Utility.assertNotUndefined(mesh.textureUniformLocation), WATER_TEXTURE_UNIT);
    gl.activeTexture(gl.TEXTURE0 + WATER_TEXTURE_UNIT);
    gl.bindTexture(gl.TEXTURE_2D, Utility.assertNotUndefined(mesh.texture));
    gl.bindVertexArray(mesh.vertexArray);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
    gl.drawElements(gl.TRIANGLES, mesh.elementCount, gl.UNSIGNED_SHORT, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
  }

  public deleteExistingMesh(mesh: Mesh | undefined): void {
    if (!mesh) {
      return;
    }
    const gl = this.glService.gl;
    gl.deleteVertexArray(mesh.vertexArray);
    gl.deleteBuffer(mesh.indexBuffer);
    if (mesh.normalBuffer) {
      gl.deleteBuffer(mesh.normalBuffer);
    }
    if (mesh.texCoordBuffer) {
      gl.deleteBuffer(mesh.texCoordBuffer);
    }
    if (mesh.positionBuffer) {
      gl.deleteBuffer(mesh.positionBuffer);
    }
    if (mesh.instanceModelTransformBuffer) {
      gl.deleteBuffer(mesh.instanceModelTransformBuffer);
    }
    if (mesh.texture) {
      gl.deleteTexture(mesh.texture);
    }
  }
}
