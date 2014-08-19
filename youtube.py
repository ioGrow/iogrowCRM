from selenium import webdriver
from selenium.webdriver.common.keys import Keys

driver = webdriver.Firefox()
for i in range(1,1000):
    driver.get("https://www.youtube.com/watch?v=vom8MUTyFuk")
    driver.refresh()
    print i
driver.close()

# assert "Python" in driver.title
# elem = driver.find_element_by_name("q")
# elem.send_keys("selenium")
# elem.send_keys(Keys.RETURN)
