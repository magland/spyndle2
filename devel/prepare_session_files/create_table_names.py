import dj_init_franklab  # noqa: F401
import json
import spyglass.common as sgc


def create_table_names():
    graph = sgc.Nwbfile.connection.dependencies
    graph.load()
    table_names = []
    for node in graph.nodes:
        print('node:', node)
        table_name = node
        table_names.append(table_name)

    table_names = sorted(table_names)

    with open('table_names.json', 'w') as f:
        json.dump(table_names, f, indent=4)


if __name__ == '__main__':
    create_table_names()
