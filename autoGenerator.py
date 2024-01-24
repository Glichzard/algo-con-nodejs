with open('options.txt', 'r') as file:
    for line in file:
        line = line.rstrip()
        print('<option value="{}">{}</option>'.format(line, line))