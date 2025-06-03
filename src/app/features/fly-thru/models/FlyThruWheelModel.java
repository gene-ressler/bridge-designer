/*
 * FlyThruWheelModel.java
 *   
 * Copyright (C) 2009 Eugene K. Ressler
 *   
 * This program is distributed in the hope that it will be useful,  
 * but WITHOUT ANY WARRANTY; without even the implied warranty of  
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the  
 * GNU General Public License for more details.  
 *   
 * You should have received a copy of the GNU General Public License  
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.  
 */

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;

import static java.lang.String.format;

import java.io.BufferedOutputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.PrintStream;

class Vector {
    public final float[] coords;

    Vector(float x, float y, float z) {
        this.coords = new float[] { x, y, z };
    }

    @Override
    public boolean equals(Object obj) {
        if (obj instanceof Vector) {
            Vector other = (Vector) obj;
            return Arrays.equals(coords, other.coords);
        }
        return false;
    }

    @Override
    public int hashCode() {
        return Arrays.hashCode(coords);
    }
}

class GL2 {
    public static final int GL_QUAD_STRIP = 1;
    public static final int GL_TRIANGLE_FAN = 0;

    private List<Vector> vertices = new ArrayList<>();
    private Map<Vector, Integer> vertexIndex = new HashMap<>();
    private List<Vector> normals = new ArrayList<>();
    private Map<Vector, Integer> normalIndex = new HashMap<>();
    private int meshType = 0;
    private int state = 0;
    private int currentNormalIndex = -1;
    private int aVertexIndex = -1;
    private int aNormalIndex = -1;
    private int bVertexIndex = -1;
    private int bNormalIndex = -1;
    private int cVertexIndex = -1;
    private int cNormalIndex = -1;
    private float zTranslate = 0;
    private StringBuilder faces = new StringBuilder();

    public static void main(String[] args) {
        writeFile("wheel.obj", (GL2 gl) -> new FlyThruWheelModel().displaySingle(gl));
        writeFile("dual-wheel.obj", (GL2 gl) -> new FlyThruWheelModel().displayDual(gl));
    }

    private static void writeFile(String name, Consumer<GL2> render) {
        try (PrintStream out = new PrintStream(
                new BufferedOutputStream(new FileOutputStream("src/app/features/fly-thru/models/" + name)), true)) {
            System.setOut(out);
            GL2 gl = new GL2();
            render.accept(gl);
            System.out.println(gl.getVerticesText());
            System.out.println(gl.getNormalsText());
            System.out.println("mtllib materials.mtl");
            System.out.println(gl.getFacesText());
        } catch (IOException ex) {
            ex.printStackTrace();
        }
    }

    public void glColor4fv(float[] v, int offset) {
        faces.append("usemtl ");
        if (v == FlyThruWheelModel.capMaterial) {
            faces.append("PaintedSteel");
        } else if (v == FlyThruWheelModel.flangeMaterial) {
            faces.append("Orange");
        } else if (v == FlyThruWheelModel.holeMaterial) {
            faces.append("Black");
        } else if (v == FlyThruWheelModel.hubMaterial) {
            faces.append("Orange");
        } else if (v == FlyThruWheelModel.rimMaterial) {
            faces.append("Aluminum");
        } else if (v == FlyThruWheelModel.tireMaterial) {
            faces.append("DarkGray");
        } else {
            throw new UnsupportedOperationException("Unknown color: " + v);
        }
        faces.append('\n');
    }

    public void glBegin(int meshType) {
        this.meshType = meshType;
    }

    public void glEnd() {
        this.meshType = 0;
        state = 0;
    }

    public void glVertex3f(float x, float y, float z) {
        Vector v = new Vector(x, y, z + zTranslate);
        int index;
        if (vertexIndex.containsKey(v)) {
            index = vertexIndex.get(v);
        } else {
            index = vertices.size();
            vertices.add(v);
            vertexIndex.put(v, index);
        }
        switch (meshType) {
            case GL_QUAD_STRIP:
                switch (state) {
                    case 0:
                        aVertexIndex = index;
                        aNormalIndex = currentNormalIndex;
                        state = 1;
                        break;
                    case 1:
                        bVertexIndex = index;
                        bNormalIndex = currentNormalIndex;
                        state = 2;
                        break;
                    case 2:
                        cVertexIndex = index;
                        cNormalIndex = currentNormalIndex;
                        state = 3;
                        break;
                    case 3:
                        face(index, currentNormalIndex, aVertexIndex, aNormalIndex, cVertexIndex, cNormalIndex);
                        face(aVertexIndex, aNormalIndex, index, currentNormalIndex, bVertexIndex, bNormalIndex);
                        aVertexIndex = cVertexIndex;
                        aNormalIndex = cNormalIndex;
                        bVertexIndex = index;
                        bNormalIndex = currentNormalIndex;
                        state = 2;
                        break;
                    default:
                        throw new UnsupportedOperationException("Unknown state " + state);
                }
                break;
            case GL_TRIANGLE_FAN:
                switch (state) {
                    case 0:
                        aVertexIndex = index;
                        aNormalIndex = currentNormalIndex;
                        state = 1;
                        break;
                    case 1:
                        bVertexIndex = index;
                        bNormalIndex = currentNormalIndex;
                        state = 2;
                        break;
                    case 2:
                        face(bVertexIndex, bNormalIndex, aVertexIndex, aNormalIndex, index, currentNormalIndex);
                        bVertexIndex = index;
                        bNormalIndex = currentNormalIndex;
                        break;
                    default:
                        break;
                }
                break;
            default:
                throw new UnsupportedOperationException("Unknown " + meshType);
        }
    }

    public void glNormal3f(float x, float y, float z) {
        float rLen = (float) (1.0 / Math.sqrt(x * x + y * y + z * z));
        Vector v = new Vector(x * rLen, y * rLen, z * rLen);
        int index;
        if (normalIndex.containsKey(v)) {
            index = normalIndex.get(v);
        } else {
            index = normals.size();
            normals.add(v);
            normalIndex.put(v, index);
        }
        currentNormalIndex = index;
    }

    public void glPushMatrix() {
    }

    public void glPopMatrix() {
        zTranslate = 0;
    }

    public void glTranslatef(float x, float y, float z) {
        zTranslate = z;
    }

    private void face(int va, int na, int vb, int nb, int vc, int nc) {
        // faces.append(format("f %d//%d %d//%d %d//%d\n", va + 1, na + 1, vb + 1, nb +
        // 1, vc + 1, nc + 1));
        faces.append(format("f %d//%d %d//%d %d//%d\n", vc + 1, nc + 1, vb + 1, nb + 1, va + 1, na + 1));
    }

    public String getVerticesText() {
        StringBuilder vertexText = new StringBuilder();
        int i = 0;
        for (Vector vertex : vertices) {
            vertexText.append(
                    format("v %f %f %f # %d\n", vertex.coords[0], vertex.coords[1], vertex.coords[2], ++i));
        }
        return vertexText.toString();
    }

    public String getNormalsText() {
        StringBuilder normalText = new StringBuilder();
        int i = 0;
        for (Vector normal : normals) {
            normalText.append(
                    format("vn %f %f %f # %d\n", normal.coords[0], normal.coords[1], normal.coords[2], ++i));
        }
        return normalText.toString();
    }

    public String getFacesText() {
        return faces.toString();
    }
}

/**
 * 3D model of truck wheel and tire in the animation.
 * 
 * @author Eugene K. Ressler
 */
class FlyThruWheelModel {

    // Number of segments in our approximation of a circle.
    private static final int segCount = 24;

    // Width of the tire tread.
    private static final float tireWidth = 0.2f;

    // Separation between dual (rear) wheels.
    private static final float dualSeparation = 0.03f;

    // Radii.
    public static final float tireRadius = 0.5f;
    private static final float tireInnerRadius = 0.3f;
    private static final float rimInnerRadius = 0.25f;
    private static final float spokeInnerRadius = 0.2f; // also hub outer radius
    private static final float holeLocation = 0.6f;
    private static final float holeRadius = holeLocation * rimInnerRadius + (1f - holeLocation) * spokeInnerRadius;
    private static final float holeRadialSize = 0.02f;
    private static final float holeInnerRadius = holeRadius - 0.5f * holeRadialSize;
    private static final float holeOuterRadius = holeRadius + 0.5f * holeRadialSize;

    // Factor used to tilt sidewall normals outward at the tire outer radius and
    // inward at the inner.
    private static final float sidewallBulge = .4f;

    // Same as above for rim.
    private static final float rimBulge = .4f;

    // Depth offsets are with respect to the tire sidewall. These give heights of
    // truncated cones that form
    // the rim, spokes, and hub. The hub itself is not truncated, but a full cone
    // made to look rounded by bump mapping.
    private static final float innerRimDepthOffset = -.03f;
    private static final float innerSpokeDepthOffset = .04f;
    private static final float hubApexDepthOffset = .08f;

    // Some static calculations too tedious for hand work.
    private static final float spokeRadialWidth = rimInnerRadius - spokeInnerRadius;
    private static final float lengthHubNormal = (float) Math
            .sqrt(innerSpokeDepthOffset * innerSpokeDepthOffset + spokeRadialWidth * spokeRadialWidth);
    private static final float rHubNormal = innerSpokeDepthOffset / lengthHubNormal;
    private static final float zHubNormal = spokeRadialWidth / lengthHubNormal;
    private static final float hubSlope = (innerSpokeDepthOffset - innerRimDepthOffset) / spokeRadialWidth;

    // Our spoke holes really aren't holes, but dark polygons that float this much
    // in front of the truncated spoke cone.
    private static final float holeVisibilityOffset = 0.01f;

    // Compute intermediate offsets at spoke hole inner and outer radii.
    private static final float holeInnerOffset = innerRimDepthOffset + (rimInnerRadius - holeInnerRadius) * hubSlope
            + holeVisibilityOffset;
    private static final float holeOuterOffset = innerRimDepthOffset + (rimInnerRadius - holeOuterRadius) * hubSlope
            + holeVisibilityOffset;

    // Spoke holse are an interal number of circle segments, set here.
    private static final int holeWidthInSegs = 3;
    private static final int holeSpacingInSegs = 6;

    private static final float sidewallBulgeComplement = (float) Math.sqrt(1.0 - sidewallBulge * sidewallBulge);
    private static final float rimBulgeComplement = (float) Math.sqrt(1.0 - rimBulge * rimBulge);
    public static final float[] tireMaterial = { 0.3f, 0.3f, 0.3f, 1f };
    public static final float[] rimMaterial = { 0.5f, 0.5f, 0.5f, 1f };
    public static final float[] hubMaterial = { 1f, 0.549f, 0f, 1f };
    public static final float[] capMaterial = { 0.4f, 0.4f, 0.4f, 1f };
    public static final float[] flangeMaterial = { .5f * 1f, .5f * 0.549f, .5f * 0f, 1f };
    public static final float[] holeMaterial = { 1f, 0.549f, 0f, 1f };

    // Precompute a unit circle for a bit of speed benefit.
    private static float[] xCircle = new float[segCount + 1];
    private static float[] yCircle = new float[segCount + 1];
    static {
        for (int i = 0; i <= segCount; i++) {
            double theta = 2 * Math.PI * i / segCount;
            xCircle[i] = (float) Math.cos(theta);
            yCircle[i] = (float) Math.sin(theta);
        }
    }

    /**
     * Set the translucency of the wheel.
     * 
     * @param alpha alpha translucency of the wheel
     */
    public void setAlpha(float alpha) {
        tireMaterial[3] = rimMaterial[3] = hubMaterial[3] = capMaterial[3] = capMaterial[3] = flangeMaterial[3] = holeMaterial[3] = alpha;
    }

    /**
     * Draw a tire only. Z-axis is the axle, with x- and y-axis congruent to the
     * rear (negative z) tire face.
     * Tire width then extends in positive z-direction.
     * 
     * @param gl GL2 context
     */
    private void drawTire(GL2 gl) {
        // tread
        gl.glColor4fv(tireMaterial, 0);
        gl.glBegin(GL2.GL_QUAD_STRIP);
        for (int i = 0; i <= segCount; i++) {
            gl.glNormal3f(xCircle[i], yCircle[i], 0f);
            gl.glVertex3f(tireRadius * xCircle[i], tireRadius * yCircle[i], tireWidth);
            gl.glVertex3f(tireRadius * xCircle[i], tireRadius * yCircle[i], 0f);
        }
        gl.glEnd();
        // front sidewall
        gl.glBegin(GL2.GL_QUAD_STRIP);
        for (int i = 0; i <= segCount; i++) {
            gl.glNormal3f(-sidewallBulge * xCircle[i], -sidewallBulge * yCircle[i], sidewallBulgeComplement);
            gl.glVertex3f(tireInnerRadius * xCircle[i], tireInnerRadius * yCircle[i], tireWidth);
            gl.glNormal3f(sidewallBulge * xCircle[i], sidewallBulge * yCircle[i], sidewallBulgeComplement);
            gl.glVertex3f(tireRadius * xCircle[i], tireRadius * yCircle[i], tireWidth);
        }
        gl.glEnd();
        // rear sidewall
        gl.glBegin(GL2.GL_QUAD_STRIP);
        for (int i = 0; i <= segCount; i++) {
            gl.glNormal3f(sidewallBulge * xCircle[i], sidewallBulge * yCircle[i], -sidewallBulgeComplement);
            gl.glVertex3f(tireRadius * xCircle[i], tireRadius * yCircle[i], 0);
            gl.glNormal3f(-sidewallBulge * xCircle[i], -sidewallBulge * yCircle[i], -sidewallBulgeComplement);
            gl.glVertex3f(tireInnerRadius * xCircle[i], tireInnerRadius * yCircle[i], 0);
        }
        gl.glEnd();
        // flange
        gl.glColor4fv(flangeMaterial, 0);
        gl.glBegin(GL2.GL_QUAD_STRIP);
        for (int i = 0; i <= segCount; i++) {
            gl.glNormal3f(-xCircle[i], -yCircle[i], 0f);
            gl.glVertex3f(tireInnerRadius * xCircle[i], tireInnerRadius * yCircle[i], 0f);
            gl.glVertex3f(tireInnerRadius * xCircle[i], tireInnerRadius * yCircle[i], tireWidth);
        }
        gl.glEnd();
    }

    /**
     * Draw a wheel only with no tire. Z-axis is the axle with x- and y-axes
     * congruent to the outer rim radius.
     * 
     * @param gl GL2 context
     */
    private void drawWheel(GL2 gl) {
        // rim
        gl.glColor4fv(rimMaterial, 0);
        gl.glBegin(GL2.GL_QUAD_STRIP);
        for (int i = 0; i <= segCount; i++) {
            gl.glNormal3f(-rimBulge * xCircle[i], -rimBulge * yCircle[i], rimBulgeComplement);
            gl.glVertex3f(rimInnerRadius * xCircle[i], rimInnerRadius * yCircle[i], innerRimDepthOffset);
            gl.glNormal3f(rimBulge * xCircle[i], rimBulge * yCircle[i], rimBulgeComplement);
            gl.glVertex3f(tireInnerRadius * xCircle[i], tireInnerRadius * yCircle[i], 0f);
        }
        gl.glEnd();
        // rear closure
        // use rim material
        gl.glBegin(GL2.GL_TRIANGLE_FAN);
        gl.glNormal3f(0f, 0f, -1f);
        gl.glVertex3f(0, 0, innerRimDepthOffset - holeVisibilityOffset);
        for (int i = segCount; i >= 0; i--) {
            gl.glVertex3f(tireInnerRadius * xCircle[i], tireInnerRadius * yCircle[i],
                    innerRimDepthOffset - holeVisibilityOffset);
        }
        gl.glEnd();
        // spokes
        gl.glColor4fv(hubMaterial, 0);
        gl.glBegin(GL2.GL_QUAD_STRIP);
        for (int i = 0; i <= segCount; i++) {
            gl.glNormal3f(rHubNormal * xCircle[i], rHubNormal * yCircle[i], zHubNormal);
            gl.glVertex3f(spokeInnerRadius * xCircle[i], spokeInnerRadius * yCircle[i], innerSpokeDepthOffset);
            gl.glVertex3f(rimInnerRadius * xCircle[i], rimInnerRadius * yCircle[i], innerRimDepthOffset);
        }
        gl.glEnd();
        // hub
        gl.glColor4fv(capMaterial, 0);
        gl.glBegin(GL2.GL_TRIANGLE_FAN);
        gl.glNormal3f(0f, 0f, 1f);
        gl.glVertex3f(0f, 0f, hubApexDepthOffset);
        for (int i = 0; i <= segCount; i++) {
            gl.glNormal3f(rHubNormal * xCircle[i], rHubNormal * yCircle[i], zHubNormal);
            gl.glVertex3f(spokeInnerRadius * xCircle[i], spokeInnerRadius * yCircle[i], innerSpokeDepthOffset);
        }
        gl.glEnd();
        // holes
        gl.glColor4fv(holeMaterial, 0);
        for (int i = 0; i <= segCount; i += holeSpacingInSegs) {
            gl.glBegin(GL2.GL_QUAD_STRIP);
            gl.glNormal3f(0f, 0f, -1f);
            for (int j = 0; j <= holeWidthInSegs; ++j) {
                int k = (i + j) % segCount;
                gl.glVertex3f(holeInnerRadius * xCircle[k], holeInnerRadius * yCircle[k], holeInnerOffset);
                gl.glVertex3f(holeOuterRadius * xCircle[k], holeOuterRadius * yCircle[k], holeOuterOffset);
            }
            gl.glEnd();
        }
    }

    /**
     * Display a single wheel with its tire. Wheel is offset for rim to coincide
     * with inner tire edge.
     * 
     * @param gl GL2 context for drawing.
     */
    public void displaySingle(GL2 gl) {
        drawTire(gl);
        gl.glPushMatrix();
        gl.glTranslatef(0f, 0f, tireWidth);
        drawWheel(gl);
        gl.glPopMatrix();
    }

    /**
     * Display a dual wheel with tires. Z-axis is the axle. Origin is between the
     * wheels.
     * 
     * @param gl GL2 context for drawing.
     */
    public void displayDual(GL2 gl) {
        // join
        gl.glColor4fv(hubMaterial, 0);
        gl.glBegin(GL2.GL_QUAD_STRIP);
        for (int i = 0; i <= segCount; i++) {
            gl.glNormal3f(xCircle[i], yCircle[i], 0f);
            gl.glVertex3f(tireInnerRadius * xCircle[i], tireInnerRadius * yCircle[i], dualSeparation);
            gl.glVertex3f(tireInnerRadius * xCircle[i], tireInnerRadius * yCircle[i], -dualSeparation);
        }
        gl.glEnd();
        // outer dual
        gl.glPushMatrix();
        gl.glTranslatef(0f, 0f, dualSeparation);
        drawWheel(gl);
        drawTire(gl);
        gl.glPopMatrix();
        // inner dual
        gl.glPushMatrix();
        gl.glTranslatef(0f, 0f, -dualSeparation - tireWidth);
        drawTire(gl);
        gl.glPopMatrix();
    }
};
