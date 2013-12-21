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
