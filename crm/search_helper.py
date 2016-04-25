SEARCH_QUERY_MODEL = """
                            %(query)s type:%(type)s
                             AND (organization: %(organization)s
                                  AND (access:public
                                       OR (owner: %(owner)s
                                           OR collaborators: %(collaborators)s
                                           )
                                       )
                                  )
                        """
def tokenize_autocomplete(phrase):
        a = []
        for word in phrase.split():
            j = 1
            while True:
                for i in range(len(word) - j + 1):
                    a.append(word[i:i + j])
                if j == len(word):
                    break
                j += 1
        return a
