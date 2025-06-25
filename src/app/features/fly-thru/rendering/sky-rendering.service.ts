import { Injectable } from '@angular/core';
import { GlService } from './gl.service';
import { Utility } from '../../../shared/classes/utility';
import { IN_POSITION_LOCATION } from '../shaders/constants';
import { ImageService } from '../../../shared/core/image.service';
import { UniformService } from './uniform.service';
import { mat4 } from 'gl-matrix';
import { ShaderService } from '../shaders/shader.service';
import { SKYBOX_TEXTURE_UNIT } from './constants';

/** Container for sky box rendering logic. */
@Injectable({ providedIn: 'root' })
export class SkyRenderingService {
  //   7--------6
  //  /|       /|
  // 4--------5 |
  // | |      | |
  // | 3------|-2
  // |/       |/
  // 0--------1
  // prettier-ignore
  private static readonly POSITIONS = new Float32Array(
    [
      -1, -1, +1, // 0
      +1, -1, +1, // 1
      +1, -1, -1, // 2
      -1, -1, -1, // 3
      -1, +1, +1, // 4
      +1, +1, +1, // 5
      +1, +1, -1, // 6
      -1, +1, -1, // 7
    ]
  );
  // Faces are counter-clockwise from the inside of the cube.
  // prettier-ignore
  private static readonly INDICES = new Uint16Array([
    1, 5, 6, // right
    6, 2, 1,
    3, 7, 4, // left
    4, 0, 3,
    5, 4, 7, // top
    7, 6, 5,
    // Bottom isn't needed:
    // 1, 2, 3, // bottom
    // 3, 0, 1,
    0, 4, 5, // front
    5, 1, 0,
    2, 6, 7, // back
    7, 3, 2,
  ]);

  private indexBuffer!: WebGLBuffer;
  private skyBoxTexture!: WebGLTexture;
  private skyBoxUniformLocation!: WebGLUniformLocation;
  private vertexArray!: WebGLVertexArrayObject;

  constructor(
    private readonly glService: GlService,
    private readonly imageService: ImageService,
    private readonly shaderService: ShaderService,
    private readonly uniformService: UniformService,
  ) {}

  public prepare() {
    const gl = this.glService.gl;
    const program = this.shaderService.getProgram('sky');
    this.skyBoxUniformLocation = gl.getUniformLocation(program, 'skybox')!;
    // The images are 1024x1024.
    const cubeMapTargetsByUrl: { [key: string]: number } = {
      'img/skye.jpg': gl.TEXTURE_CUBE_MAP_POSITIVE_X,
      'img/skyw.jpg': gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
      'img/skyup.jpg': gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
      'img/skydn.jpg': gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
      'img/skyn.jpg': gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
      'img/skys.jpg': gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
    };
    this.vertexArray = Utility.assertNotNull(gl.createVertexArray());
    gl.bindVertexArray(this.vertexArray);
    const positionBuffer = Utility.assertNotNull(gl.createBuffer());
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, SkyRenderingService.POSITIONS, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(IN_POSITION_LOCATION);
    gl.vertexAttribPointer(IN_POSITION_LOCATION, 3, gl.FLOAT, false, 0, 0);
    this.indexBuffer = Utility.assertNotNull(gl.createBuffer());
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, SkyRenderingService.INDICES, gl.STATIC_DRAW);

    this.skyBoxTexture = Utility.assertNotNull(gl.createTexture());
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.skyBoxTexture);
    // Initially use null textures. Replace with images asynchronously.
    for (const target of Object.values(cubeMapTargetsByUrl)) {
      gl.texImage2D(target, 0, gl.RGBA, 1024, 1024, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    }
    this.imageService
      .createImagesLoader(Object.keys(cubeMapTargetsByUrl))
      .invokeAfterLoaded(imagesByUrl => {
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.skyBoxTexture);
        for (const [url, image] of Object.entries(imagesByUrl)) {
          gl.texImage2D(cubeMapTargetsByUrl[url], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
          gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        }
      });
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  }

  /** Renders the sky box. Best done last to maximize gain from depth tests. */
  public render(viewMatrix: mat4, projectionMatrix: mat4) {
    this.uniformService.updateSkyboxTransformsUniform(viewMatrix, projectionMatrix);
    const gl = this.glService.gl;
    gl.useProgram(this.shaderService.getProgram('sky'));
    gl.depthFunc(gl.LEQUAL);
    // TODO: Experiment with doing this once, not once per frame. Possible because we have fewer textures than units?
    gl.uniform1i(this.skyBoxUniformLocation, SKYBOX_TEXTURE_UNIT);
    gl.activeTexture(gl.TEXTURE0 + SKYBOX_TEXTURE_UNIT);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.skyBoxTexture);
    gl.bindVertexArray(this.vertexArray);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.drawElements(gl.TRIANGLES, SkyRenderingService.INDICES.length, gl.UNSIGNED_SHORT, 0);
    gl.depthFunc(gl.LESS);
  }
}
