Feature: Simulator
  As a developer
  I need a CLI simulator to run many games
  So that I can test bot strategies and gather statistics

  @simulator
  Scenario: Run single game simulation
    Given a simulator configured with:
      | setting     | value                    |
      | games       | 1                        |
      | players     | 4                        |
      | bots        | Easy,Normal,Hard,Pro     |
      | seed        | 12345                    |
    When the simulation is run
    Then exactly 1 game should be played
    And a winner should be determined
    And the result should be logged

  @simulator
  Scenario: Run multiple game simulation
    Given a simulator configured with:
      | setting     | value                    |
      | games       | 100                      |
      | players     | 4                        |
      | bots        | Easy,Normal,Hard,Pro     |
    When the simulation is run
    Then exactly 100 games should be played
    And win statistics should be collected
    And each bot's win rate should be calculated

  @simulator @performance
  Scenario: Large simulation runs efficiently
    Given a simulator configured with:
      | setting     | value                    |
      | games       | 10000                    |
      | players     | 4                        |
      | bots        | Pro,Pro,Pro,Pro          |
    When the simulation is run
    Then it should complete in under 60 seconds
    And memory usage should remain stable

  @simulator @reporting
  Scenario: Simulation produces detailed report
    Given a simulator configured with:
      | setting     | value                    |
      | games       | 1000                     |
      | players     | 4                        |
      | bots        | Easy,Normal,Hard,Pro     |
    When the simulation is run
    Then the report should include:
      | metric                       |
      | Win rate per bot             |
      | Average game length          |
      | Average challenges per game  |
      | Bluff success rate           |
      | Total games played           |
      | Duration                     |

  @simulator @determinism
  Scenario: Same seed produces same results
    Given a simulator with seed 42
    When 100 games are simulated
    And the results are recorded as "first_run"
    And the simulator is reset with seed 42
    And 100 games are simulated again
    And the results are recorded as "second_run"
    Then "first_run" should equal "second_run"

  @simulator @player-counts
  Scenario Outline: Simulate with different player counts
    Given a simulator configured with:
      | setting     | value          |
      | games       | 100            |
      | players     | <player_count> |
    When the simulation is run
    Then all <player_count> bots should have win statistics

    Examples:
      | player_count |
      | 3            |
      | 4            |
      | 5            |
      | 6            |

  @simulator @cli
  Scenario: CLI accepts command line arguments
    When I run the CLI with "--games 100 --players 4 --bots Easy,Normal,Hard,Pro --seed 42"
    Then the simulator should:
      | action                        |
      | Parse 100 games               |
      | Parse 4 players               |
      | Parse bot difficulties        |
      | Use seed 42                   |
      | Run the simulation            |
      | Output results to stdout      |

  @simulator @output
  Scenario: CLI output format
    Given a completed simulation with:
      | bot    | wins |
      | Easy   | 123  |
      | Normal | 221  |
      | Hard   | 284  |
      | Pro    | 372  |
    Then the output should include:
      """
      === Valepaska Simulation Results ===
      Games: 1,000 | Players: 4

      Win Rates:
        Easy   (P1): 12.3%  (123 wins)
        Normal (P2): 22.1%  (221 wins)
        Hard   (P3): 28.4%  (284 wins)
        Pro    (P4): 37.2%  (372 wins)
      """




