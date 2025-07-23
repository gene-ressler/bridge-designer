import { Utility } from '../../../shared/classes/utility';
import * as shaderSources from './shaders';
import { Injectable } from '@angular/core';

export type ProgramSpec = { name: string; vertexShader: WebGLShader; fragmentShader: WebGLShader };
export type Programs = { [key: string]: WebGLProgram };
type CompileFailure = { program: string; linkLog: string | null; vertexLog: string | null; fragmentLog: string | null };

@Injectable({ providedIn: 'root' })
export class ShaderService {
  private programs: Programs | undefined;

  public prepareShaders(gl: WebGL2RenderingContext) {
    this.programs = this.buildPrograms(gl);
  }

  public getProgram(name: string): WebGLProgram {
    const program = this.programs?.[name];
    if (!program) {
      throw new Error(`Missing shader: ${name}`);
    }
    return program;
  }

  private buildPrograms(gl: WebGL2RenderingContext): Programs | undefined {
    const shaders = this.compileShaders(gl);
    const programSpecs: ProgramSpec[] = [
      {
        name: 'buckling_member',
        vertexShader: shaders['BUCKLED_MEMBER_VERTEX_SHADER'],
        fragmentShader: shaders['BUCKLED_MEMBER_FRAGMENT_SHADER'],
      },
      {
        name: 'colored_mesh',
        vertexShader: shaders['COLORED_MESH_VERTEX_SHADER'],
        fragmentShader: shaders['COLORED_MESH_FRAGMENT_SHADER'],
      },
      {
        name: 'colored_mesh_instances',
        vertexShader: shaders['COLORED_MESH_INSTANCES_VERTEX_SHADER'],
        fragmentShader: shaders['COLORED_MESH_FRAGMENT_SHADER'],
      },
      {
        name: 'instance_colored_mesh',
        vertexShader: shaders['INSTANCE_COLORED_MESH_VERTEX_SHADER'],
        fragmentShader: shaders['INSTANCE_COLORED_MESH_FRAGMENT_SHADER'],
      },
      {
        name: 'overlay',
        vertexShader: shaders['OVERLAY_VERTEX_SHADER'],
        fragmentShader: shaders['OVERLAY_FRAGMENT_SHADER'],
      },
      {
        name: 'terrain',
        vertexShader: shaders['TERRAIN_VERTEX_SHADER'],
        fragmentShader: shaders['TERRAIN_FRAGMENT_SHADER'],
      },
      {
        name: 'river',
        vertexShader: shaders['RIVER_VERTEX_SHADER'],
        fragmentShader: shaders['RIVER_FRAGMENT_SHADER'],
      },
      {
        name: 'sky',
        vertexShader: shaders['SKY_VERTEX_SHADER'],
        fragmentShader: shaders['SKY_FRAGMENT_SHADER'],
      },
      {
        name: 'textured_mesh',
        vertexShader: shaders['TEXTURED_MESH_VERTEX_SHADER'],
        fragmentShader: shaders['TEXTURED_MESH_FRAGMENT_SHADER'],
      },
      {
        name: 'textured_mesh_instances',
        vertexShader: shaders['TEXTURED_MESH_INSTANCES_VERTEX_SHADER'],
        fragmentShader: shaders['TEXTURED_MESH_FRAGMENT_SHADER'],
      },
      {
        name: 'wire',
        vertexShader: shaders['WIRE_VERTEX_SHADER'],
        fragmentShader: shaders['WIRE_FRAGMENT_SHADER'],
      },
      {
        name: 'wire_instances',
        vertexShader: shaders['WIRE_INSTANCES_VERTEX_SHADER'],
        fragmentShader: shaders['WIRE_FRAGMENT_SHADER'],
      }
    ];
    return this.linkPrograms(gl, programSpecs);
  }

  /** Compiles shaders.ts, returning an object keyed on export name. Ignores compile errors. */
  private compileShaders(gl: WebGL2RenderingContext): { [key: string]: WebGLShader } {
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

  /** Links shader programs, return an object keyd on given program name. Logs link and shader compile errors. */
  private linkPrograms(gl: WebGL2RenderingContext, programSpecs: ProgramSpec[]): Programs | undefined {
    const result: { [key: string]: WebGLProgram } = {};
    const failed: CompileFailure[] = [];
    for (const { name, vertexShader, fragmentShader } of programSpecs) {
      const program = gl.createProgram();
      if (program === null) {
        continue;
      }
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
        result[name] = program;
      } else {
        const linkLog = gl.getProgramInfoLog(program);
        const vertexLog = gl.getShaderInfoLog(vertexShader);
        const fragmentLog = gl.getShaderInfoLog(fragmentShader);
        failed.push({ program: name, linkLog, vertexLog, fragmentLog });
        gl.detachShader(program, vertexShader);
        gl.deleteShader(vertexShader);
        gl.detachShader(program, fragmentShader);
        gl.deleteShader(fragmentShader);
        gl.deleteProgram(program);
      }
    }
    if (failed.length > 0) {
      console.error('shaders:', failed);
      return undefined;
    }
    return result;
  }

  /** Cleans up shaders. For use after programs are linked. Not currently needed.
  public deleteShaders(gl: WebGL2RenderingContext, programSpecs: ProgramSpec[], programs: Programs) {
    const deleted = new Set<WebGLShader>();
    for (const { name, vertexShader, fragmentShader } of programSpecs) {
      const program = programs[name];
      detachAndDeleteShader(program, vertexShader);
      detachAndDeleteShader(program, fragmentShader);
    }

    function detachAndDeleteShader(program: WebGLProgram, vertexShader: WebGLShader) {
      if (!deleted.has(vertexShader)) {
        gl.detachShader(program, vertexShader);
        gl.deleteShader(vertexShader);
        deleted.add(vertexShader);
      }
    }
  }
  */
}
