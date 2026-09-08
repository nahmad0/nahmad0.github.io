"""
Nabil Allimi
Prof. Scott Weiss
CMSCI 453
3/10/2026



This program solves the maximum sum sublist problem using divide and conquer.
For each subarray, the maximum sublist must be either fully in the left half, fully in the right half,
or crossing the middle. The program recursively solves the left and right halves,
then computes the best crossing sublist by scanning outward from the midpoint.
It returns the sublist with the largest sum along with its starting and ending positions.


"""
import math

# setting up a file reader that prompts to user to enter the file name. The file should contain a list of integers, one per line where the firt line is the number of list (lines) in the file.

file_name = input("Enter the file name that contains the list of integers: ")
# file_name = "number.txt" # testing purposes only. 
try: # some error handling in case the file is not found. 
    with open(file_name, 'r') as file:
        # read the first line to get the number of integer. 
        first_line = int(file.readline().strip())
        print("number of lists : ", first_line)
        # read the rest of the lines to get the list of integers
        # print the list of integers to the console.
        print("list of integers : ")
        num_integers = []   # put them in a list for later use line by line.  
        for i in range(first_line): # iterate as many times as the number of lines in the file.
            line = file.readline().strip() # read the line and remove any leading or trailing whitespace characters.
            int_list = [int(x) for x in line.split()] # split the line into a list of strings and convert each string to an integer using a list comprehension.
            # now we put in the big list I created
            num_integers.append(int_list)
    
except FileNotFoundError: # if the file is not found, print an error message.
    print("File not found. Please check the file name and try again.")
# print(num_integers) #Debug # print the list of integers to the console.


#====================
# Programing part to fine the maximum sublist sum of a the integers. 
# ======================
# now that we successfully read the file and put the integers in a list, we can go about the problem. 

"""
Divide and Conquerer method can be used to break the program down into smaller subproblems recursively that can be solved independently and then combined to find the solution to the original problem.

Descriptions of the algorithm Doing Divide and Conquerer method:
A list of inter A[1..n] is given. 
the goal is to find the maximum consecutive sublist sum of the list


            Divide into smaller problems --> 
    m = n/2
    The list is going to be divided into two haves A[1..m] and A[m+1..n]
    - right  = A[m+1..n]
    - left  = A[1..m]


            Solve the smaller problems -->
    - To solve the problem, we got couple seniorios
    - the sublist is entirely in the left half or entirely in the right half, we can solve the problem by recursively.
    -  THe other possibility is that the sublist is between the two halves, in this case we can solve 
    the problem by finding the maximum sublist sum that includes the middle element.
    Since the algorithm check for all the possiblities we always find teh maximum sublist sum.
    -- Base case: if the list has only one element, the maximum sublist sum is the value of that element. Ex: A[1] =[K] --> the maximum sublist sum is K.

    
            combine the results -->
    - To combine the results, we need to compare the maximum sublist sum from the left half, the right half, and the maximum sublist sum that includes the middle element. The maximum of these three values will be the maximum sublist sum for the entire list.




"""
 # maxSublistSum(A[i..j], i, j)
def maxSublistSum(A, i, j):
    # base case: if the list has only one element, the maximum sublist sum is the value of that element. Ex: A[1] =[K] --> the maximum sublist sum is K.
    if i == j:
        return (A[i],i,j) #We must return a tuple for consistency with other return values. 
    
    # divide the list into two halves
    m = math.floor((i + j) / 2)
    
    # recursively find the maximum sublist sum in the left half and right half
    left_max = maxSublistSum(A, i, m)
    right_max = maxSublistSum(A, m + 1, j)
    
    # find the maximum sublist sum that includes the middle element
    mid_max = maxCrossingSum(A, i, m, j) # time of this n 
    
    # return the maximum of the three values
    # return max(left_max, right_max, mid_max) # RETURN THE MAXIMUM OF THE THREE VALUES. but I got a tuple which breaks this code. 
    # we compare the first elements of these list to see which one is the maximum and return the corresponding tuple.
    if max(left_max[0], right_max[0], mid_max[0]) == left_max[0]:
        return left_max # the left contains it
    elif max(left_max[0], right_max[0], mid_max[0]) == right_max[0]:
        return right_max # the right contains the maximum sublist sum that includes the middle element.
    else:
        return mid_max # this is the maximum sublist sum that includes the middle element.

# maxCrossingSum(A[i..j], i, m, j) -> i = starting index, m = middle index, j = ending index
# In includes the middle elements while looking for the maximum. 
def maxCrossingSum(A, i, m, j):
    # find the maximum sublist sum that includes the middle element
    # Iterating from the middle to the left and from the middle to the right 
    sum = 0

    # first initialize to None to have a clear check for the first iteration - ERROR nonotype with int type error
    # trying zero => we also have negative numbers which wont be ideal for this 
    # so we find the smallest value possible. 
    # https://stackoverflow.com/questions/33249645/smallest-negative-int-in-python
    left_sum = float('-inf') # this is the smallest value possible in python.

    for k in range(m, i - 1, -1):
        sum += A[k]
        if sum > left_sum: # in the left side update the left sum and index only we find a better sum. 
            left_sum = sum
            left_index = k  # this is the maximum sublist sum that includes the middle element and is on the left side of the middle element.
        # this is the index of the last element in the left side of the middle element.

        #  handling the right side of the middle element.
    sum = 0
    right_sum = float('-inf') 
    for k in range(m + 1, j + 1):
        sum += A[k]
        if sum > right_sum: # It is important because we want to update the right sum and the index only when we find a better sum.

            right_sum = sum
            right_index = k  # this is the maximum sublist sum that includes the middle element and is on the right side of the middle element. 
        # this is the index of the last element in the right side of the middle element. We are only updating when the sum is improving
    
    return (left_sum + right_sum, left_index, right_index) # return the maximum sublist sum that includes the middle element and the index of the last element in the left side and the index of the first element in the right side.



# NOW WE CHEKK OUR NESTED LIST
# we will loop through the nested list
for L in num_integers:
    max_sum, i,j = maxSublistSum(L, 0, len(L) - 1)
    print( max_sum, L[i:j+1])


#+++ 
# Output formate (SUM [MAX SUBSET])
#+++



"""
 ## Recursive Relation of Running Using Master Theorem 
Since the algorithm divides the problem each time into n/, the relation can shown as:   
    T(n) = 2T(n/2) +? 
TO solve is the time that it takes for us to combine and compare the results from the two halves.
The time to combine the results is O(n) because we need to compare the maximum sublist because we need to check for the maximum sublist that includes the middle element.
So T(n) = 2T(n/2) + n

Now we can apply the master theorem to solve this relation.
The master theorem states that if T(n) = aT(n/b) + f(n), where a >= 1 and b > 1, then:
a = b^k  = 2 
f(n) = n
k = 1
\theta(n^k log n) = \theta(n log n)
 """