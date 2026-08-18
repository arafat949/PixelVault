import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import java.io.File;

public class PixelVaultUnitTest {
    @Test
    public void testProjectStructure() {
        File indexFile = new File("index.html");
        assertNotNull(indexFile, "index.html file must exist in the root directory.");
    }
}