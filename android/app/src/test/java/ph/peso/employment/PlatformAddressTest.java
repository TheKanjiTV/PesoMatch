package ph.peso.employment;
import org.junit.Test;
import static org.junit.Assert.*;

public class PlatformAddressTest {
    @Test public void httpsOriginNormalizesWithoutPath() { assertEquals("https://office.example",MainActivity.validateOrigin(" https://Office.Example/ ",false)); }
    @Test public void localWifiAddressAllowedForDebug() { assertEquals("http://192.168.1.40:8444",MainActivity.validateOrigin("http://192.168.1.40:8444",true)); }
    @Test public void emulatorAddressAllowedForDebug() { assertEquals("http://10.0.2.2:8444",MainActivity.validateOrigin("http://10.0.2.2:8444",true)); }
    @Test(expected=IllegalArgumentException.class) public void releaseRefusesCleartext() { MainActivity.validateOrigin("http://192.168.1.40:8444",false); }
    @Test(expected=IllegalArgumentException.class) public void debugRefusesPublicCleartext() { MainActivity.validateOrigin("http://office.example",true); }
    @Test(expected=IllegalArgumentException.class) public void credentialsAreNotAnOrigin() { MainActivity.validateOrigin("https://user:password@office.example",false); }
    @Test(expected=IllegalArgumentException.class) public void javascriptIsRejected() { MainActivity.validateOrigin("javascript:alert(1)",true); }
    @Test(expected=IllegalArgumentException.class) public void deceptivePrivateHostnameIsRejected() { MainActivity.validateOrigin("http://10.evil.example",true); }
    @Test(expected=IllegalArgumentException.class) public void invalidIpv4IsRejected() { MainActivity.validateOrigin("http://192.168.999.1",true); }
    @Test(expected=IllegalArgumentException.class) public void pagePathsAreRejected() { MainActivity.validateOrigin("https://office.example/login",false); }
    @Test(expected=IllegalArgumentException.class) public void queryStringsAreRejected() { MainActivity.validateOrigin("https://office.example?token=secret",false); }
}
