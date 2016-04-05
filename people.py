#!/usr/bin/python
# -*- coding: utf-8 -*-
import cookielib
import json
import re
import urllib

import mechanize
import requests
from bs4 import BeautifulSoup
from google.appengine.ext import ndb

from iograph import Edge
from iomessages import LinkedinProfileSchema, TwitterProfileSchema, LinkedinCompanySchema
from model import LinkedinPage, ProxyServer

mechanize._sockettimeout._GLOBAL_DEFAULT_TIMEOUT = 100

get_info = lambda p: p.text if p else ''
decode = lambda p: p.encode('utf-8')

def _open_url(br, url):
    try:
        return br.open(url)
    except:
        return br.open(url)


class linked_in:
    def __init__(self):
        # Browser
        br = mechanize.Browser()

        # Cookie Jar
        cj = cookielib.LWPCookieJar()
        br.set_cookiejar(cj)

        # Browser options
        br.set_handle_equiv(True)
        br.set_handle_gzip(True)
        br.set_handle_redirect(True)
        br.set_handle_referer(True)
        br.set_handle_robots(False)

        # Follows refresh 0 but not hangs on refresh > 0
        br.set_handle_refresh(mechanize._http.HTTPRefreshProcessor(), max_time=1)

        # Want debugging messages?
        # br.set_debug_http(True)
        # br.set_debug_redirects(True)
        # br.set_debug_responses(True)

        # User-Agent (this is cheating, ok?)
        # User-Agent': "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36
        br.addheaders = [('User-agent',
                          'Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.9.0.1) Gecko/2008071615 Fedora/3.0.1-1.fc9 Firefox/3.0.1')]
        self.browser = br
        self.proxy_base_url = None

    def open_via_proxy(self, url):
        cached_page = LinkedinPage.get_by_url(url)
        if cached_page:
            return cached_page.html
        else:
            params = {"url": url}
            proxy_server = ProxyServer.choose()
            if proxy_server:
                try:
                    r = requests.post("http://" + proxy_server.ip + ":8080/api/get_content", data=json.dumps(params))
                    rjson = r.json()
                    if "html" in rjson:
                        cached_page = LinkedinPage(url=url, html=rjson["html"])
                        cached_page.put()
                        ProxyServer.update_status(proxy_server, 'ready')
                        return rjson["html"]
                    else:
                        ProxyServer.update_status(proxy_server, 'problem')
                        return None
                except:
                    ProxyServer.update_status(proxy_server, 'problem')
                    return None
            else:
                print '-------------------ALL servers blocked-------------'
                return None

    def dice_coefficient(self, a, b):
        a = a.encode('utf8').lower()
        b = b.encode('utf8').lower()
        if not (len(a) and len(b)):
            return 0.0
        if len(a) == 1:
            a += u'.'
        if len(b) == 1:
            b += u'.'

        a_bigram_list = []
        for i in range(len(a) - 1):
            a_bigram_list.append(a[i:i + 2])
        b_bigram_list = []
        for i in range(len(b) - 1):
            b_bigram_list.append(b[i:i + 2])

        a_bigrams = set(a_bigram_list)
        b_bigrams = set(b_bigram_list)
        overlap = len(a_bigrams & b_bigrams)
        dice_coeff = overlap * 2.0 / (len(a_bigrams) + len(b_bigrams))
        return dice_coeff

    @classmethod
    def get_linkedin_url(self, url):
        a = re.search(
            r"https?://((www|\w\w)\.)?linkedin.com/((in/[^/]+/?)|(title/[^/]+/?)|(pub/[^/]+/((\w|\d)+/?){3}))", url)
        if a:
            b = a.group(1)
            a = a.group(0)
            if '&' in a:
                url = a.split('&')
                if url:
                    new_url = url[0]
                    if b:
                        return new_url.replace(b, "")
                    return new_url
                else:
                    return None
            else:
                return a

    def open_url(self, keyword):
        br = self.browser
        params = {'q': decode(keyword) + ' site:linkedin.com'}
        encoded_url_params = urllib.urlencode(params)
        url = decode('https://www.google.com/search?' + encoded_url_params)
        _open_url(br, url)
        html = br.response().read()
        soup = BeautifulSoup(html)
        h = soup.find_all("h3", {"class": "r"})
        lien = []
        for hh in h:
            text = hh.a['href']
            link = self.get_linkedin_url(text)
            if link:
                lien.append(link)
        return self.open_via_proxy(lien[0])

    def start_urls(self, keyword):
        br = self.browser
        params = {'q': decode(keyword) + ' site:linkedin.com'}
        encoded_url_params = urllib.urlencode(params)
        url = decode('https://www.google.com/search?' + encoded_url_params)
        _open_url(br, url)
        html = br.response().read()
        soup = BeautifulSoup(html)
        h = soup.find_all("h3", {"class": "r"})
        lien = []
        for hh in h:
            text = hh.a['href']
            link = self.get_linkedin_url(text)
            if link:
                lien.append(link)
        return ",".join(["%s" % k for k in lien])

    def start_spider(self, keyword):
        # url=self.start_urls(keyword)
        # r= requests.post("http://104.154.81.17:6800/schedule.json", #
        r = requests.post("http://localhost:6800/schedule.json",  #
                          params={
                              "project": "linkedin",
                              "spider": "Linkedin",
                              "keyword": keyword
                          })
        return r.text

    def open_url_twitter(self, firstname, lastname):
        self.browser.open('https://www.google.com')
        self.browser.response().read()
        self.browser.select_form(nr=0)
        self.browser.form['q'] = firstname + ' ' + lastname + ' twitter'
        self.browser.submit()
        self.browser.response().read()
        link = self.browser.links(url_regex="twitter.com")
        links = [l for l in link]
        if links:
            return self.browser.follow_link(links[0]).geturl()

    def open_url_twitter_list(self, keyword):
        br = self.browser
        params = {'q': decode(keyword) + ' site:twitter.com'}
        encoded_url_params = urllib.urlencode(params)
        url = decode('https://www.google.com/search?' + encoded_url_params)
        _open_url(br, url)
        html = br.response().read()
        soup = BeautifulSoup(html)
        h = soup.find_all("div", {"class": "g"})
        lien = []
        for hh in h:
            href = hh.a['href']
            name = hh.a.text.split("|")[0]
            title = hh.find("div", {"class": "f slp"})
            if title:
                title = title.text
            else:
                title = "--"
            a = re.search('q=(.*)&sa', href).group(1)
            if "/status/" not in a and (self.dice_coefficient(name, keyword) >= 0.5):
                lien.append({"name": name, "title": title, "url": a})
        return lien

    def open_url_twitter_company(self, name):
        self.browser.open('https://www.google.com')
        self.browser.response().read()
        self.browser.select_form(nr=0)
        self.browser.form['q'] = name + ' twitter'
        self.browser.submit()
        self.browser.response().read()
        link = self.browser.links(url_regex="twitter.com")
        links = [l for l in link]
        if links:
            return self.browser.follow_link(links[0]).geturl()

    def open_url_company(self, name):
        self.browser.open('https://www.google.com')
        self.browser.response().read()
        self.browser.select_form(nr=0)
        self.browser.form['q'] = name + ' linkedin'
        self.browser.submit()
        self.browser.response().read()
        link = self.browser.links(url_regex="linkedin.com")
        links = [l for l in link]
        if links:
            return self.browser.follow_link(links[0]).read()

    def get_profile_header(self, soup, person):
        p = soup.find('span', {'class': 'full-name'})
        person["full-name"] = get_info(p)

        p = soup.find('p', {'class': 'title'})
        person["title"] = get_info(p)

        p = soup.find('span', {'class': 'locality'})
        person["locality"] = get_info(p)

        p = soup.find('dd', {'class': 'industry'})
        person["industry"] = get_info(p)

        p = soup.find('div', {'class': 'member-connections'})
        if p:
            person["relation"] = get_info(p.strong)
        else:
            person["relation"] = ''

        current_post = soup.find('tr', {'id': 'overview-summary-current'})
        # ---------------------------------------------------------
        tab = []
        if current_post:
            for post in current_post.findAll('li'):
                tab.append(post.text)
        person['current_post'] = tab
        # ------------------------------------------------------------
        tab = []
        past_post = soup.find('tr', {'id': 'overview-summary-past'})
        if past_post:
            for post in past_post.findAll('li'):
                tab.append(post.text.replace('\n', ' '))
        person['past_post'] = tab
        # ------------------------------------------------------------
        tab = []
        formation = soup.find('tr', {'id': 'overview-summary-education'})
        if formation:
            for post in formation.findAll('li'):
                tab.append(post.text)
        person['formations'] = tab
        # ------------------------------------------------------------
        p = soup.find('div', {'class': 'profile-picture'})
        if p:
            if p.a:
                if self.proxy_base_url:
                    person['profile_picture'] = self.proxy_base_url + p.a.img.get("src")
                else:
                    person['profile_picture'] = p.a.img.get("src")
            else:
                person['profile_picture'] = ''
        else:
            person['profile_picture'] = ''
        # -------------------------------------------------------------
        # p=soup.find('tr',{'id':'overview-recommendation-count'})
        # person['recommendation']=get_info(p.td.strong)
        tab = []
        formation = soup.find('dd', {'class': 'websites'})
        if formation:
            for post in formation.findAll('li'):
                tab.append('www.linkedin.com' + post.a.get('href'))
        person['websites'] = tab

    def get_exprience(self, soup):
        expriences = {}
        profile_experience = soup.find('div', {'id': 'background-experience'})
        if profile_experience:
            for post in ["current-position", "past-position"]:
                exprience = profile_experience.findAll('div', {'class': 'editable-item section-item ' + post})
                tab = []
                if exprience:
                    for ex in exprience:
                        exp = {}
                        a = ex.find('h4')
                        if a:
                            exp['title'] = get_info(a)
                        a = ex.find('h5', class_=False)
                        if a:
                            exp['organisation'] = get_info(a.a)
                        a = ex.find('span', {'class': 'experience-date-locale'})
                        if a:
                            exp['period'] = a.get_text()
                        a = ex.find('p', {'class': 'description summary-field-show-more'})
                        if a:
                            exp['description'] = get_info(a)
                        tab.append(exp)
                    expriences[post] = tab

        return expriences

    def get_education(self, soup):
        profile_education = soup.find('div', {'id': 'background-education'})
        tab = []
        if profile_education:
            exprience = profile_education.findAll('div', {'class': 'editable-item section-item'})
            for ex in exprience:
                exp = {}
                a = ex.find('h4')
                if a:
                    exp['title'] = get_info(a)
                a = ex.find('h5', class_=False)
                if a:
                    exp['degree'] = get_info(a)
                a = ex.find('span', {'class': 'education-date'})
                if a:
                    exp['period'] = a.get_text()
                tab.append(exp)
        return tab

    def get_resume(self, soup):
        r = soup.find('p', {'class': "description"})
        return get_info(r)

    def get_certification(self, soup):
        certifications = []
        certification_soup = soup.find('div', {'id': "profile-certifications"})
        if certification_soup:
            certif_soup = certification_soup.findAll('li', {'class': 'certification'})
            if certif_soup:
                for c in certif_soup:
                    certification = {'name': c.h3.text}
                    specific_soup = c.findAll('li')
                    tab = []
                    if specific_soup:
                        for sp in specific_soup:
                            tab.append(sp.text)
                        certification['specifics'] = tab
                    certifications.append(certification)
        return certifications

    def get_skills(self, soup):
        tab = []
        skills_soup = soup.find('ul', {'class': "skills-section compact-view"})
        if skills_soup:
            list_soup = skills_soup.findAll('span', {'class': 'endorse-item-name-text'})
            for s in list_soup:
                tab.append(get_info(s))
        return tab


    def open_url_list(self, keyword):
        br = self.browser
        params = {'q': decode(keyword) + ' site:linkedin.com'}
        encoded_url_params = urllib.urlencode(params)
        url = decode('https://www.google.com/search?' + encoded_url_params)
        _open_url(br, url)
        html = br.response().read()
        soup = BeautifulSoup(html)
        h = soup.find_all("div", {"class": "g"})
        lien = {}
        for hh in h:
            href = hh.a['href']
            name = hh.a.text.split("|")[0]
            title = hh.find("div", {"class": "f slp"})
            if title:
                title = title.text
            else:
                title = "--"
            a = self.get_linkedin_url(href)
            if a and ("/dir/" not in a) and (self.dice_coefficient(name, keyword) >= 0.5) and a not in lien:
                lien[a] = {"name": name, "title": title, "url": a}
        return lien.values()

    def open_company_list(self, keyword):
        br = self.browser
        params = {'q': decode(keyword) + ' site:linkedin.com/company'}
        encoded_url_params = urllib.urlencode(params)
        url = 'https://www.google.com/search?' + encoded_url_params
        _open_url(br, url)
        html = br.response().read()

        soup = BeautifulSoup(html)
        h = soup.find_all("div", {"class": "g"})
        lien = []
        company_name = []
        for hh in h:
            href = hh.a['href']
            name = hh.a.text.split("|")[0]
            desc = hh.find("span", {"class": "st"})
            if desc:
                desc = desc.text
            else:
                desc = "--"
            a = re.search('q=(.*)&sa', href).group(1)
            if "pub-pbmap" in a:
                link = a.split('%')[0]
            else:
                link = a
            if (self.dice_coefficient(name, keyword) >= 0.5) and name not in company_name:
                lien.append({"name": name, "desc": desc, "url": link})
                company_name.append(name)
        return lien


    def scrape_linkedin_url(self, url):
        person = {}
        html = self.open_via_proxy(url)
        if html:
            soup = BeautifulSoup(html)
            self.get_profile_header(soup, person)
            person['experiences'] = self.get_exprience(soup)
            person['resume'] = self.get_resume(soup)
            person['certifications'] = self.get_certification(soup)
            person['education'] = self.get_education(soup)
            person['url'] = url

        return person

    def scrape_twitter(self, firstname, lastname):
        html = self.open_url_twitter(firstname, lastname)
        if html:
            return html

    def scrape_twitter_company(self, name):
        html = self.open_url_twitter_company(name)
        if html:
            return html

    def scrape_company(self, url):
        company = {}
        html = self.open_via_proxy(url)
        if html:
            soup = BeautifulSoup(html)
            name = soup.find('span', {'itemprop': "name"})
            if name:
                company["name"] = name.text
            else:
                company["name"] = None
            image_wrapper = soup.find('div', {'class': 'image-wrapper'})
            if image_wrapper:
                company["logo"] = image_wrapper.img.get("src")
            else:
                company["logo"] = None
            top_image = soup.find('div', {'class': 'top-image'})
            if top_image:
                company["top_image"] = top_image.img.get("data-li-lazy-load-src")
            else:
                company["top_image"] = None
            followers = soup.find('p', {'class': 'followers-count'})
            if followers:
                company["followers"] = followers.strong.text
            else:
                company["followers"] = None
            summary = soup.find('div', {'class': 'text-logo'})
            if summary:
                company["summary"] = summary.p.text
            else:
                company["summary"] = None
            specialties = soup.find('div', {'class': 'specialties'})
            if specialties:
                company["specialties"] = specialties.p.text.replace('\n', '')
            else:
                company["specialties"] = None
            website = soup.find('li', {'class': 'website'})
            if website:
                company["website"] = website.p.text.replace('\n', '')
            else:
                company["website"] = None
            industry = soup.find('li', {'class': 'industry'})
            if industry:
                company["industry"] = industry.p.text.replace('\n', '')

            else:
                company["industry"] = None
            headquarters = soup.find('li', {'class': 'vcard hq'})
            address = {}

            if headquarters:
                company["headquarters"] = headquarters.p.text
                try:
                    address["street_address"] = [a.text for a in
                                                 headquarters.find_all('span', {'class': 'street-address'})]
                    address["locality"] = get_info(headquarters.find('span', {'class': 'locality'}))
                    address["region"] = get_info(headquarters.find('span', {'class': 'region'}))
                    address["postal_code"] = get_info(headquarters.find('span', {'class': 'postal-code'}))
                    address["country_name"] = get_info(headquarters.find('span', {'class': 'country-name'}))
                    company["address"] = address
                except Exception, e:
                    raise e

            else:
                company["headquarters"] = None
            type = soup.find('li', {'class': 'type'})
            if type:
                company["type"] = type.p.text.replace('\n', '')
            else:
                company["type"] = None
            company_size = soup.find('li', {'class': 'company-size'})
            if company_size:
                company["company_size"] = company_size.p.text.replace('\n', '')

            else:
                company["company_size"] = None
            founded = soup.find('li', {'class': 'founded'})
            if founded:
                company["founded"] = founded.p.text.replace('\n', '')
            else:
                company["founded"] = None
            workers = soup.find('div', {"class": "discovery-panel"})
            company["workers"] = self.get_workers(workers)
            company["url"] = url
        return company

    @classmethod
    # arezki lebdiri 15/07/2014
    def get_people(cls, entityKey):

        key = ndb.Key(urlsafe=entityKey)
        result = Edge.list(start_node=key, kind='linkedin')
        if result['items']:
            profile_key = result['items'][0].end_node
            pro = profile_key.get()
            response = LinkedinProfileSchema(
                lastname=pro.lastname,
                firstname=pro.firstname,
                industry=pro.industry,
                locality=pro.locality,
                headline=pro.headline,
                current_post=pro.current_post,
                past_post=pro.past_post,
                formations=pro.formations,
                websites=pro.websites,
                relation=pro.relation,
                experiences=pro.experiences,
                resume=pro.resume,
                certifications=pro.certifications,
                skills=pro.skills,
                url=pro.url
            )
            return response

    def get_workers(self, soup):
        workers = []
        if soup:
            soup = soup.findAll('li')
            if soup:
                for w in soup:
                    worker = {}
                    if w:
                        worker["url"] = w.a.get('href')
                        worker["img"] = w.img.get('src')
                        name = w.find('span', {'class': 'given-name'})
                        if name:
                            worker["firstname"] = name.text
                        name = w.find('span', {'class': 'family-name'})
                        if name:
                            worker["lastname"] = name.text
                        function = w.find('dd', {'class': 'take-action-headline'})
                        if function:
                            worker["function"] = function.text
                        workers.append(worker)
        return workers

    def get_company(self, url):
        response = LinkedinCompanySchema()
        result = self.scrape_company(url)
        if result:
            response = LinkedinCompanySchema(
                name=result["name"],
                website=result["website"],
                industry=result["industry"],
                headquarters=result["headquarters"],
                summary=result["summary"],
                founded=result["founded"],
                followers=result["followers"],
                logo=result["logo"],
                specialties=result["specialties"],
                top_image=result["top_image"],
                type=result["type"],
                company_size=result["company_size"],
                url=result["url"],
                workers=json.dumps(result["workers"]),
                address=json.dumps(result["address"])
            )
        return response


    @classmethod
    # meziane hadjadj 07/08/2014
    def get_people_twitter(cls, entityKey):
        key = ndb.Key(urlsafe=entityKey)
        result = Edge.list(start_node=key, kind='twitter')
        if result['items']:
            profile_key = result['items'][0].end_node
            profile = profile_key.get()
            response = TwitterProfileSchema(
                id=profile.id,
                followers_count=profile.followers_count,
                last_tweet_text=profile.last_tweet_text,
                last_tweet_favorite_count=profile.last_tweet_favorite_count,
                last_tweet_retweeted=profile.last_tweet_retweeted,
                last_tweet_retweet_count=profile.last_tweet_retweet_count,
                language=profile.language,
                created_at=profile.created_at,
                nbr_tweets=profile.nbr_tweets,
                description_of_user=profile.description_of_user,
                friends_count=profile.friends_count,
                name=profile.name,
                screen_name=profile.screen_name,
                url_of_user_their_company=profile.url_of_user_their_company,
                location=profile.location,
                profile_image_url_https=profile.profile_image_url_https,
                lang=profile.lang,
                profile_banner_url=profile.profile_banner_url
            )
            return response

