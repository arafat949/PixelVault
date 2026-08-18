import org.junit.jupiter.api.Test;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.io.File;

public class PixelVaultUITest {

    @Test
    public void testPixelVaultPageTitle() {
        
        System.setProperty("webdriver.chrome.silentOutput", "true");
        Logger.getLogger("org.openqa.selenium").setLevel(Level.OFF);

        ChromeOptions options = new ChromeOptions();
       
        options.addArguments("--log-level=3");

        WebDriver driver = new ChromeDriver(options);
        
        File htmlFile = new File("index.html");
        driver.get("file://" + htmlFile.getAbsolutePath());
        
        System.out.println("Loaded Page Title: " + driver.getTitle());
        
        driver.quit();
    }
}