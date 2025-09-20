import { Utility } from '../../../shared/classes/utility';
import { GlService } from '../rendering/gl.service';
import * as shaderSources from './shaders';
import { Injectable } from '@angular/core';

export type ProgramSpec = {
  name: string;
  displayVertexShaderName: string;
  depthVertexShaderName?: string;
  fragmentShaderName: string;
};
export type Programs = { [key: string]: WebGLProgram };
type CompileFailure = {
  compileKind: 'failure';
  program: string;
  linkLog: string | null;
  vertexLog: string | null;
  fragmentLog: string | null;
};
type CompileSuccess = { compileKind: 'success'; program: WebGLProgram };
type CompileMissing = { compileKind: 'missing'; program: string };

/**
 * Specs for shader programs. Each may result in a display program and also an optional depth-only program
 * with empty fragment shader for the shadow buffer. A spec with name `foo` and a `depthVertexShaderName`
 * produces programs with lookup keys `foo`  and `foo_depth`.
 */
// TODO: For performance, specialized depth shaders could skip color attribute setup.
const PROGRAM_SPECS: ProgramSpec[] = [
  {
    name: 'buckling_member',
    displayVertexShaderName: 'BUCKLED_MEMBER_VERTEX_SHADER',
    depthVertexShaderName: 'BUCKLED_MEMBER_VERTEX_SHADER',
    fragmentShaderName: 'BUCKLED_MEMBER_FRAGMENT_SHADER',
  },
  {
    name: 'colored_mesh',
    displayVertexShaderName: 'COLORED_MESH_VERTEX_SHADER',
    depthVertexShaderName: 'COLORED_MESH_VERTEX_SHADER',
    fragmentShaderName: 'COLORED_MESH_FRAGMENT_SHADER',
  },
  {
    name: 'colored_mesh_instances',
    displayVertexShaderName: 'COLORED_MESH_INSTANCES_VERTEX_SHADER',
    depthVertexShaderName: 'COLORED_MESH_INSTANCES_VERTEX_SHADER',
    fragmentShaderName: 'COLORED_MESH_FRAGMENT_SHADER',
  },
  {
    name: 'depth_texture',
    displayVertexShaderName: 'DEPTH_TEXTURE_VERTEX_SHADER',
    fragmentShaderName: 'DEPTH_TEXTURE_FRAGMENT_SHADER',
  },
  {
    name: 'instance_colored_mesh',
    displayVertexShaderName: 'INSTANCE_COLORED_MESH_VERTEX_SHADER',
    depthVertexShaderName: 'INSTANCE_COLORED_MESH_VERTEX_SHADER',
    fragmentShaderName: 'INSTANCE_COLORED_MESH_FRAGMENT_SHADER',
  },
  {
    name: 'overlay',
    displayVertexShaderName: 'OVERLAY_VERTEX_SHADER',
    fragmentShaderName: 'OVERLAY_FRAGMENT_SHADER',
  },
  {
    name: 'terrain',
    displayVertexShaderName: 'TERRAIN_VERTEX_SHADER',
    fragmentShaderName: 'TERRAIN_FRAGMENT_SHADER',
  },
  {
    name: 'river',
    displayVertexShaderName: 'RIVER_VERTEX_SHADER',
    fragmentShaderName: 'RIVER_FRAGMENT_SHADER',
  },
  {
    name: 'sky',
    displayVertexShaderName: 'SKY_VERTEX_SHADER',
    fragmentShaderName: 'SKY_FRAGMENT_SHADER',
  },
  {
    name: 'textured_mesh',
    displayVertexShaderName: 'TEXTURED_MESH_VERTEX_SHADER',
    depthVertexShaderName: 'TEXTURED_MESH_VERTEX_SHADER',
    fragmentShaderName: 'TEXTURED_MESH_FRAGMENT_SHADER',
  },
  {
    name: 'textured_mesh_instances',
    displayVertexShaderName: 'TEXTURED_MESH_INSTANCES_VERTEX_SHADER',
    depthVertexShaderName: 'TEXTURED_MESH_INSTANCES_VERTEX_SHADER',
    fragmentShaderName: 'TEXTURED_MESH_FRAGMENT_SHADER',
  },
  {
    name: 'wire',
    displayVertexShaderName: 'WIRE_VERTEX_SHADER',
    fragmentShaderName: 'WIRE_FRAGMENT_SHADER',
  },
  {
    name: 'wire_instances',
    displayVertexShaderName: 'WIRE_INSTANCES_VERTEX_SHADER',
    depthVertexShaderName: 'WIRE_INSTANCES_VERTEX_SHADER',
    fragmentShaderName: 'WIRE_FRAGMENT_SHADER',
  },
];

@Injectable({ providedIn: 'root' })
export class ShaderService {
  private programs: Programs | undefined;

  constructor(private readonly glService: GlService) {}

  /** Compiles and links all`PROGRAM_SPECS`. A program can then be fetched with `getProgram(key)*.  */
  public prepareShaders(): void {
    const shaders = this.compileShaders();
    const emptyFragmentShader = shaders['EMPTY_FRAGMENT_SHADER'];
    const programs: Programs = {};
    const failed: (CompileFailure | CompileMissing)[] = [];
    for (const { name, displayVertexShaderName, depthVertexShaderName, fragmentShaderName } of PROGRAM_SPECS) {
      appendResult(name, this.linkProgram(name, shaders[displayVertexShaderName], shaders[fragmentShaderName]));
      if (depthVertexShaderName) {
        const depthName = name + '_depth';
        appendResult(depthName, this.linkProgram(depthName, shaders[depthVertexShaderName], emptyFragmentShader));
      }
    }
    if (failed.length > 0) {
      console.error('shaders:', failed);
    }
    this.programs = programs;

    /** Appends the result of a single shader compilation. */
    function appendResult(name: string, linkResult: CompileFailure | CompileMissing | CompileSuccess) {
      switch (linkResult.compileKind) {
        case 'success':
          programs[name] = linkResult.program;
          break;
        case 'failure':
        case 'missing':
          failed.push(linkResult);
          break;
      }
    }
  }

  /** Gets the given program or throws if it's not present. */
  public getProgram(name: string): WebGLProgram {
    if (this.glService.isRenderingDepth) {
      name += '_depth';
    }
    const program = this.programs?.[name];
    if (!program) {
      throw new Error(`Missing shader: ${name}`);
    }
    return program;
  }

  /** Compiles shaders.ts, returning an object keyed on export name. Ignores compile errors. */
  private compileShaders(): { [key: string]: WebGLShader } {
    const gl = this.glService.gl;
    const result: { [key: string]: WebGLShader } = {};
    for (const exportName in shaderSources) {
      const shaderKind = exportName.includes('VERTEX') ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER;
      const shader = Utility.assertNotNull(gl.createShader(shaderKind));
      gl.shaderSource(shader, shaderSources[exportName as keyof typeof shaderSources]);
      gl.compileShader(shader);
      result[exportName] = shader;
    }
    return result;
  }

  private linkProgram(
    name: string,
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader,
  ): CompileSuccess | CompileFailure | CompileMissing {
    const gl = this.glService.gl;
    const program = gl.createProgram();
    if (vertexShader === undefined || fragmentShader === undefined) {
      return { compileKind: 'missing', program: name };
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
      return { compileKind: 'success', program };
    }
    const linkLog = gl.getProgramInfoLog(program);
    const vertexLog = gl.getShaderInfoLog(vertexShader);
    const fragmentLog = gl.getShaderInfoLog(fragmentShader);
    const failure: CompileFailure = { compileKind: 'failure', program: name, linkLog, vertexLog, fragmentLog };
    gl.detachShader(program, vertexShader);
    gl.deleteShader(vertexShader);
    gl.detachShader(program, fragmentShader);
    gl.deleteShader(fragmentShader);
    gl.deleteProgram(program);
    return failure;
  }
}
