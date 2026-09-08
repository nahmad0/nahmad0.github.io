"""
Nabil Allimi
Prof. Weiss
Programming Project 4
4/29/2026


Party Arrangment Program
The program will match people tegether in a table based on the constraints given in the input file.
The program will read in a file with the following format:
First line: number of people at the party
Next n lines: names of the people at the party then the number of constraints and then the constraints and then the number of test cases and then the test cases.
The program will then use a union find data structure to determine if the constraints can be satisfied and if the test cases are valid.

Basically we will use a union find data structure to keep track of which people are sitting together.

Each person is a node
Each person must sit together means = Union(a,b).



"""

# Input file party with try error if reading run into an error. 
def readFile():

    try: 
        with open("partyinfo.txt", "r") as f: # opening a file
            num = int(f.readline().strip("\n")) # strip is good to get ride of line breaks
            # print(num)
            names_index = {} # creating a place hodler to put the names in it when we loop through it. 
            for _ in range(num):
                # print(line)
                name = f.readline().strip()
                names_index[name] = _ # reading the names and putting them in the list.
                # flip the dictionary because "name" --> index
            # print(names_index)
            num = int(f.readline().strip()) # reading the next section
            constraints = [] # number of constriaints
            # print(num)
            for _ in range(num): # reading the next section
                constraint = f.readline().strip()
                constraints.append(constraint) # reading the constraints
            # print(constraints)
            num = int(f.readline().strip())
            testCases = []
            # print(num)
            for _ in range(num): # reading the next section
                test = f.readline().strip() # reating the test cases
                testCases.append(test)
            # print(testCases) # comment out for debuging puropses. 
    except FileNotFoundError as e:
        print("reading the file Error", e)

    return names_index, constraints, testCases

# Now that we have read the file we go and set up the program. 


def makeParent(n): # make everyone their own parent
    
    return [-1]*n # negative shows they are their own parent

def find(parent,x): # find the leader of the person in the table. 
    if parent[x] < 0: # if negative just return because negative means its the parent
        return x
    parent[x] = find(parent, parent[x]) # recursive case
    return parent[x] # return the parent. 

def union(parent, a, b):
    root_a = find(parent, a) # find the leader of a
    # print(root_a) # debuging to see the leader of a
    root_b = find(parent, b) # find the leader of b
    # print(root_b) # debuging to see the leader of b
    if root_a == root_b:
        return # which means they are already in the same set.
    if parent[root_a] < parent[root_b]: # if root_a is bigger than root_b
        parent[root_a] += parent[root_b] # add the size of root_b to root_a
        parent[root_b] = root_a # make root_b point to root_a
    else:
        parent[root_b] += parent[root_a] # add the size of root_a to root_b
        parent[root_a] = root_b # make root_a point to root_b
    

# +========================
# Main function to run everything. 
# +========================
def main():
    names_index, constraints, testCases = readFile() # reading the file and getting the data.
    parents = makeParent(len(names_index)) 
    # for debuging purposes 
    # print(parents)
    # print(names_index)
    # print(constraints)
    # print(testCases)

    # processing the constraints and making the unions.
    for constraint in constraints:
        # print(parents) # debuging each round to see how the parents list is changing.
        # print(names_index['Dominic']) # testing 
        person1, person2 = constraint.split("*") # 
        # print(person1, person2)

        index1 = names_index[person1] # getting the index of the person in the names_index list.
        index2 = names_index[person2] 

        union(parents, index1, index2) # making the union of the two people if they are in the same set settubg together.

    queryNum = 1 # meet the output formate
    for test in testCases: # doing the test cases 
        person1, person2 = test.split("*") # spliting the test cases by *

        if person1 not in names_index or person2 not in names_index: # IF the person is not in the list we just print out Error
            print(f"{queryNum}. ERROR")
        else: # else we get the index of the person in the names_index list and then we find the leader of the person and if they are in the same set we print YES else we print NO
            index1 = names_index[person1]
            index2 = names_index[person2]

            if find(parents, index1) == find(parents, index2): # if they have same leader then they are in the same table
                print(f"{queryNum}. YES")
            else: # if they are not in the same set then they are not at the same table.
                print(f"{queryNum}. NO")
        queryNum += 1 # incrementing the query number for the next test case.
    





# calling main. 
main()
