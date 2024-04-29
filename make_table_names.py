import json


def make_table_names():
    # you need to create table_graph.json using other code that depends on spyglass
    with open('table_graph.json', 'r') as f:
        x = json.load(f)
    tables = x['tables']
    table_names = [table['table_name'] for table in tables]
    with open('table_names.json', 'w') as f:
        json.dump(table_names, f, indent=4)


if __name__ == '__main__':
    make_table_names()
