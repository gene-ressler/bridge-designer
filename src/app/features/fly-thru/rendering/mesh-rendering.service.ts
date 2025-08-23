import { Injectable } from '@angular/core';
import {
  IN_POSITION_LOCATION,
  IN_NORMAL_LOCATION,
  IN_MATERIAL_REF_LOCATION,
  IN_INSTANCE_MODEL_TRANSFORM_LOCATION,
  IN_TEX_COORD_LOCATION,
  IN_DIRECTION_LOCATION,
  IN_INSTANCE_COLOR_LOCATION,
  IN_NORMAL_REF_LOCATION,
} from '../shaders/constants';
import { ShaderService } from '../shaders/shader.service';
import { GlService } from './gl.service';
import { ImageService } from '../../../shared/core/image.service';
import { Colors } from '../../../shared/classes/graphics';
import { FACIA_TEXTURE_UNIT, WATER_TEXTURE_UNIT } from './constants';

export type MeshData = {
  positions: Float32Array;
  normals?: Float32Array;
  normalRefs?: Uint16Array;
  texCoords?: Float32Array;
  materialRefs?: Uint16Array;
  indices: Uint16Array;
  // For instanced drawing, one mat4 per instance.
  instanceModelTransforms?: Float32Array;
  instanceColors?: Float32Array;
  usage?: {
    positions?: number;
    normals?: number;
    normalRefs?: number;
    texCoords?: number;
    materialRefs?: number;
    instanceModelTransforms?: number;
    instanceColors?: number;
  };
};

export type Mesh = {
  vertexArray: WebGLVertexArrayObject;
  indexBuffer: WebGLBuffer;
  elementCount: number;

  positionBuffer?: WebGLBuffer;
  normalBuffer?: WebGLBuffer;
  normalRefBuffer?: WebGLBuffer;
  materialRefBuffer?: WebGLBuffer;
  texture?: WebGLTexture;
  textureUniformLocation?: WebGLUniformLocation;
  texCoordBuffer?: WebGLBuffer;
  instanceModelTransformBuffer?: WebGLBuffer;
  instanceModelTransforms?: Float32Array; // Backing data.
  instanceColorBuffer?: WebGLBuffer;
  instanceColors?: Float32Array; // Backing data.
  instanceCount?: number;
  instanceLimit?: number;
};

export type WireData = {
  positions: Float32Array;
  directions: Float32Array;
  indices: Uint16Array;
  // For instanced drawing, one mat4 per instance.
  instanceModelTransforms?: Float32Array;
  usage?: {
    positions?: number;
    directions?: number;
    instanceModelTransforms?: number;
  };
};

export type Wire = {
  vertexArray: WebGLVertexArrayObject;
  indexBuffer: WebGLBuffer;
  elementCount: number;
  positionBuffer: WebGLBuffer;
  directionBuffer: WebGLBuffer;
  instanceModelTransformBuffer?: WebGLBuffer;
  instanceModelTransforms?: Float32Array; // Backing data.
  instanceCount?: number;
  instanceLimit?: number;
};

/** Container for the WebGL details of rendering meshes: one-time preparation and per-frame drawing. */
@Injectable({ providedIn: 'root' })
export class MeshRenderingService {
  constructor(
    private readonly glService: GlService,
    private readonly imageService: ImageService,
    private readonly shaderService: ShaderService,
  ) {}

  /** Prepares a colored mesh for drawing. Optionially retains backing data for future updates. */
  public prepareColoredMesh(meshData: MeshData, updatable: boolean = false): Mesh {
    const gl = this.glService.gl;
    const vertexArray = gl.createVertexArray()!;
    gl.bindVertexArray(vertexArray);
    const positionBuffer = this.prepareBuffer(IN_POSITION_LOCATION, meshData.positions, meshData.usage?.positions);
    const normalBuffer = this.prepareBuffer(IN_NORMAL_LOCATION, meshData.normals!, meshData.usage?.normals);
    let instanceColorBuffer, materialRefBuffer;
    // If both are provided, we're favoring the instance colors.
    if (meshData.instanceColors) {
      instanceColorBuffer = this.prepareBuffer(
        IN_INSTANCE_COLOR_LOCATION,
        meshData.instanceColors!,
        meshData.usage?.instanceColors,
        3,
        gl.FLOAT,
        1,
      );
    } else {
      materialRefBuffer = this.prepareBuffer(
        IN_MATERIAL_REF_LOCATION,
        meshData.materialRefs!,
        meshData.usage?.materialRefs,
        1,
        gl.UNSIGNED_SHORT,
      );
    }
    const indexBuffer = this.prepareIndexBuffer(meshData.indices);
    const instanceModelTransformBuffer = this.prepareInstanceModelTransformBuffer(
      meshData.instanceModelTransforms,
      meshData.usage?.instanceModelTransforms,
    );
    const elementCount = meshData.indices.length;
    const instanceCount = meshData.instanceModelTransforms ? meshData.instanceModelTransforms.length / 16 : 0;

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);

    const mesh: Mesh = {
      vertexArray,
      indexBuffer,
      elementCount,
      instanceCount,
      positionBuffer,
      normalBuffer,
      materialRefBuffer,
      instanceColorBuffer,
      instanceModelTransformBuffer,
    };
    if (updatable) {
      mesh.instanceModelTransforms = meshData.instanceModelTransforms;
      mesh.instanceColors = meshData.instanceColors;
    }
    return mesh;
  }

  /** Renders a previously prepared color facet mesh.  */
  public renderColoredMesh(mesh: Mesh): void {
    const gl = this.glService.gl;
    gl.useProgram(
      this.shaderService.getProgram(
        mesh.instanceColorBuffer
          ? 'instance_colored_mesh'
          : mesh.instanceCount
            ? 'colored_mesh_instances'
            : 'colored_mesh',
      ),
    );
    gl.bindVertexArray(mesh.vertexArray);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
    if (mesh.instanceCount) {
      gl.drawElementsInstanced(
        gl.TRIANGLES,
        mesh.elementCount,
        gl.UNSIGNED_SHORT,
        0,
        mesh.instanceLimit ?? mesh.instanceCount,
      );
    } else {
      gl.drawElements(gl.TRIANGLES, mesh.elementCount, gl.UNSIGNED_SHORT, 0);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
  }

  /** Prepares a mesh for an updateable buckled member bending in a parabola. */
  public prepareBuckledMemberMesh(meshData: MeshData): Mesh {
    const gl = this.glService.gl;
    const vertexArray = gl.createVertexArray()!;
    gl.bindVertexArray(vertexArray);
    const positionBuffer = this.prepareBuffer(IN_POSITION_LOCATION, meshData.positions, meshData.usage?.positions);
    const normalRefBuffer = this.prepareBuffer(
      IN_NORMAL_REF_LOCATION,
      meshData.normalRefs!,
      meshData.usage?.normalRefs,
      1,
      gl.UNSIGNED_SHORT,
    );
    const indexBuffer = this.prepareIndexBuffer(meshData.indices);
    const instanceModelTransformBuffer = this.prepareInstanceModelTransformBuffer(
      meshData.instanceModelTransforms,
      meshData.usage?.instanceModelTransforms,
    );
    const elementCount = meshData.indices.length;
    const instanceCount = meshData.instanceModelTransforms ? meshData.instanceModelTransforms.length / 16 : 0;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
    return {
      vertexArray,
      indexBuffer,
      elementCount,
      instanceCount,
      positionBuffer,
      normalRefBuffer,
      instanceModelTransformBuffer,
      instanceModelTransforms: meshData.instanceModelTransforms,
    };
  }

  /** Renders a buckled member mesh. */
  public renderBuckledMemberMesh(mesh: Mesh) {
    const gl = this.glService.gl;
    gl.useProgram(this.shaderService.getProgram('buckling_member'));
    gl.bindVertexArray(mesh.vertexArray);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
    gl.drawElementsInstanced(gl.TRIANGLES, mesh.elementCount, gl.UNSIGNED_SHORT, 0, mesh.instanceCount!);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
  }

  /** Prepares a colored mesh for drawing. Not updateable.. */
  public prepareTexturedMesh(meshData: MeshData, textureUrl: string, preloadColor: Uint8Array): Mesh {
    const gl = this.glService.gl;

    const vertexArray = gl.createVertexArray()!;
    gl.bindVertexArray(vertexArray);
    const positionBuffer = this.prepareBuffer(IN_POSITION_LOCATION, meshData.positions, meshData.usage?.positions);
    const normalBuffer = this.prepareBuffer(IN_NORMAL_LOCATION, meshData.normals!, meshData.usage?.normals);
    const texCoordBuffer = this.prepareBuffer(IN_TEX_COORD_LOCATION, meshData.texCoords!, meshData.usage?.texCoords, 2);
    const indexBuffer = this.prepareIndexBuffer(meshData.indices);
    const instanceModelTransformBuffer = this.prepareInstanceModelTransformBuffer(
      meshData.instanceModelTransforms,
      meshData.usage?.instanceModelTransforms,
    );
    const texture = this.prepareTexture(textureUrl, preloadColor);

    let programName, instanceCount;
    if (meshData.instanceModelTransforms) {
      programName = 'textured_mesh_instances';
      instanceCount = meshData.instanceModelTransforms.length / 16;
    } else {
      programName = 'textured_mesh';
      instanceCount = 0;
    }
    const program = this.shaderService.getProgram(programName);
    const textureUniformLocation = gl.getUniformLocation(program, 'meshTexture')!;
    const elementCount = meshData.indices.length;

    // Not clearing texture and vertex array bindings because I don't understand semantics re async image load.

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
      instanceModelTransformBuffer,
    };
  }

  public renderTexturedMesh(mesh: Mesh): void {
    const gl = this.glService.gl;
    gl.useProgram(this.shaderService.getProgram(mesh.instanceCount ? 'textured_mesh_instances' : 'textured_mesh'));
    gl.bindVertexArray(mesh.vertexArray);
    // TODO: Experiment with doing this once, not once per frame. Possible because we have fewer textures than units?
    // Then no texture location would be needed in the mesh data.
    gl.uniform1i(mesh.textureUniformLocation!, FACIA_TEXTURE_UNIT);
    gl.activeTexture(gl.TEXTURE0 + FACIA_TEXTURE_UNIT);
    gl.bindTexture(gl.TEXTURE_2D, mesh.texture!);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
    if (mesh.instanceCount) {
      gl.drawElementsInstanced(gl.TRIANGLES, mesh.elementCount, gl.UNSIGNED_SHORT, 0, mesh.instanceCount);
    } else {
      gl.drawElements(gl.TRIANGLES, mesh.elementCount, gl.UNSIGNED_SHORT, 0);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
  }

  /** Replaces the instance transform data of the given mesh. */
  public updateInstanceModelTransforms(meshOrWire: Mesh | Wire, usage: number = this.glService.gl.STREAM_DRAW): void {
    if (!meshOrWire.instanceModelTransforms) {
      return; // Not updateable
    }
    const gl = this.glService.gl;
    gl.bindVertexArray(meshOrWire.vertexArray);
    gl.bindBuffer(gl.ARRAY_BUFFER, meshOrWire.instanceModelTransformBuffer!);
    // Replace all data even if there's a limit because subdata updates are said to hinder GPU parallelism.
    // TODO: Experiment to see if this is true or makes any difference.
    gl.bufferData(gl.ARRAY_BUFFER, meshOrWire.instanceModelTransforms, usage, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
  }

  /** Replaces the instance colors of the given mesh. */
  public updateInstanceColors(mesh: Mesh, usage: number = this.glService.gl.STREAM_DRAW): void {
    if (!mesh.instanceColors) {
      return; // Not updateable
    }
    const gl = this.glService.gl;
    gl.bindVertexArray(mesh.vertexArray);
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.instanceColorBuffer!);
    // See comment in updateInstanceModelTransforms. Same TODO.
    gl.bufferData(gl.ARRAY_BUFFER, mesh.instanceColors, usage, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
  }

  /** Prepares a terrain mesh. */
  public prepareTerrainMesh(meshData: MeshData): Mesh {
    const gl = this.glService.gl;

    const vertexArray = gl.createVertexArray()!;
    gl.bindVertexArray(vertexArray);
    const positionBuffer = this.prepareBuffer(IN_POSITION_LOCATION, meshData.positions, meshData.usage?.positions);
    const normalBuffer = this.prepareBuffer(IN_NORMAL_LOCATION, meshData.normals!, meshData.usage?.normals);
    const indexBuffer = this.prepareIndexBuffer(meshData.indices);
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

    const vertexArray = gl.createVertexArray()!;
    gl.bindVertexArray(vertexArray);

    const positionBuffer = this.prepareBuffer(IN_POSITION_LOCATION, meshData.positions, meshData.usage?.positions, 2);
    const indexBuffer = this.prepareIndexBuffer(meshData.indices);
    const texture = this.prepareTexture('img/water.jpg', Colors.GL_WATER);

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
    gl.uniform1i(mesh.textureUniformLocation!, WATER_TEXTURE_UNIT);
    gl.activeTexture(gl.TEXTURE0 + WATER_TEXTURE_UNIT);
    gl.bindTexture(gl.TEXTURE_2D, mesh.texture!);
    gl.bindVertexArray(mesh.vertexArray);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
    gl.drawElements(gl.TRIANGLES, mesh.elementCount, gl.UNSIGNED_SHORT, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
  }

  /** Prepares a wire from given raw data. */
  public prepareWire(wireData: WireData, updatable: boolean = false): Wire {
    const gl = this.glService.gl;

    const vertexArray = gl.createVertexArray()!;
    gl.bindVertexArray(vertexArray);

    const positionBuffer = this.prepareBuffer(IN_POSITION_LOCATION, wireData.positions, wireData.usage?.positions);
    const directionBuffer = this.prepareBuffer(IN_DIRECTION_LOCATION, wireData.directions, wireData.usage?.directions);
    const indexBuffer = this.prepareIndexBuffer(wireData.indices);
    const instanceModelTransformBuffer = this.prepareInstanceModelTransformBuffer(
      wireData.instanceModelTransforms,
      wireData.usage?.instanceModelTransforms,
    );
    const elementCount = wireData.indices.length;
    const instanceCount = wireData.instanceModelTransforms ? wireData.instanceModelTransforms.length / 16 : 0;

    const wire: Wire = {
      vertexArray,
      positionBuffer,
      directionBuffer,
      indexBuffer,
      elementCount,
      instanceCount,
      instanceModelTransformBuffer,
    };
    if (updatable) {
      wire.instanceModelTransforms = wireData.instanceModelTransforms;
    }
    return wire;
  }

  /** Renders the already prepared wire. */
  public renderWire(wire: Wire) {
    const gl = this.glService.gl;
    gl.useProgram(this.shaderService.getProgram(wire.instanceCount ? 'wire_instances' : 'wire'));
    gl.bindVertexArray(wire.vertexArray);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, wire.indexBuffer);
    if (wire.instanceCount) {
      gl.drawElementsInstanced(gl.LINES, wire.elementCount, gl.UNSIGNED_SHORT, 0, wire.instanceCount);
    } else {
      gl.drawElements(gl.LINES, wire.elementCount, gl.UNSIGNED_SHORT, 0);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
  }

  /** Deletes OpenGl resources of a previously prepared wire. */
  public deleteExistingWire(wire: Wire | undefined): void {
    if (!wire) {
      return;
    }
    const gl = this.glService.gl;
    gl.deleteVertexArray(wire.vertexArray);
    gl.deleteBuffer(wire.indexBuffer);
    gl.deleteBuffer(wire.directionBuffer);
    gl.deleteBuffer(wire.positionBuffer);
    if (wire.instanceModelTransformBuffer) {
      gl.deleteBuffer(wire.instanceModelTransformBuffer);
    }
  }

  public deleteExistingMesh(mesh: Mesh | undefined): void {
    if (!mesh) {
      return;
    }
    const gl = this.glService.gl;
    gl.deleteVertexArray(mesh.vertexArray);
    gl.deleteBuffer(mesh.indexBuffer);
    if (mesh.positionBuffer) {
      gl.deleteBuffer(mesh.positionBuffer);
    }
    if (mesh.normalBuffer) {
      gl.deleteBuffer(mesh.normalBuffer);
    }
    if (mesh.normalRefBuffer) {
      gl.deleteBuffer(mesh.normalRefBuffer);
    }
    if (mesh.materialRefBuffer) {
      gl.deleteBuffer(mesh.materialRefBuffer);
    }
    if (mesh.instanceColorBuffer) {
      gl.deleteBuffer(mesh.instanceColorBuffer);
    }
    if (mesh.texture) {
      gl.deleteTexture(mesh.texture);
    }
    if (mesh.texCoordBuffer) {
      gl.deleteBuffer(mesh.texCoordBuffer);
    }
    if (mesh.instanceModelTransformBuffer) {
      gl.deleteBuffer(mesh.instanceModelTransformBuffer);
    }
  }

  private prepareTexture(url: string, preloadColor: Uint8Array): WebGLTexture {
    const gl = this.glService.gl;
    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // Use a solid color texture of 1 pixel until the water image loads.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, preloadColor);
    this.imageService.createImagesLoader([url]).invokeAfterLoaded(imagesByUrl => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imagesByUrl[url]);
      gl.generateMipmap(gl.TEXTURE_2D);
    });
    gl.generateMipmap(gl.TEXTURE_2D);
    return texture;
  }

  private prepareBuffer(
    location: number,
    data: ArrayBufferView,
    usage: number = this.glService.gl.STATIC_DRAW,
    size: number = 3,
    type: number = this.glService.gl.FLOAT,
    divisor: number = 0,
  ): WebGLBuffer {
    const gl = this.glService.gl;
    const buffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, usage);
    gl.enableVertexAttribArray(location);
    if (this.glService.isIntType(type)) {
      gl.vertexAttribIPointer(location, size, type, 0, 0);
    } else {
      gl.vertexAttribPointer(location, size, type, false, 0, 0);
    }
    gl.vertexAttribDivisor(location, divisor);
    return buffer;
  }

  private prepareInstanceModelTransformBuffer(
    data: Float32Array | undefined,
    usage: number = this.glService.gl.STATIC_DRAW,
  ): WebGLBuffer | undefined {
    if (data === undefined) {
      return undefined;
    }
    const gl = this.glService.gl;
    const buffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, usage);
    // Vertex attributes are limited to 4 floats. This trick sends columns of 4x4.
    // They're assembled magically by the shader.
    for (let i = 0; i < 4; ++i) {
      const location = IN_INSTANCE_MODEL_TRANSFORM_LOCATION + i;
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, 4, gl.FLOAT, false, 64, i * 16);
      gl.vertexAttribDivisor(location, 1);
    }
    return buffer;
  }

  private prepareIndexBuffer(data: Uint16Array): WebGLBuffer {
    const gl = this.glService.gl;
    const buffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return buffer;
  }
}
